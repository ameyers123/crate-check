/**
 * Audio analysis: samples in, numbers out.
 *
 * The rest of this project starts from numbers an analyzer already produced.
 * This is the step before that — real signal processing over decoded samples,
 * small enough to run in a browser tab while you watch.
 *
 * Nothing here is novel. That is rather the point: four cheap measurements
 * separate a usable record from a broken download, and none of them need a
 * lookup, an account or a reference database.
 */

/** Root-mean-square level: how loud, averaged over the whole clip. */
export function rms(x: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < x.length; i++) sum += x[i] * x[i];
  return Math.sqrt(sum / Math.max(1, x.length));
}

/**
 * Zero-crossing rate, in crossings per second.
 *
 * A bass-led record crosses zero slowly. Noise crosses constantly — it is the
 * cheapest way to tell "music" from "hiss" without looking at a spectrum.
 */
export function zeroCrossingRate(x: Float32Array, sampleRate: number): number {
  let crossings = 0;
  for (let i = 1; i < x.length; i++) {
    if ((x[i - 1] >= 0 && x[i] < 0) || (x[i - 1] < 0 && x[i] >= 0)) crossings++;
  }
  return (crossings * sampleRate) / Math.max(1, x.length);
}

/* --------------------------------------------------------------------- FFT */

/**
 * In-place iterative radix-2 Cooley-Tukey. `re`/`im` must be a power of two.
 *
 * Written out rather than pulled from a library so the analysis stage has no
 * dependency you'd have to trust.
 */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  if (n <= 1) return;
  if ((n & (n - 1)) !== 0) throw new Error(`fft: length ${n} is not a power of two`);

  // Bit-reversal permutation.
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const uRe = re[i + k];
        const uIm = im[i + k];
        const vRe = re[i + k + len / 2] * curRe - im[i + k + len / 2] * curIm;
        const vIm = re[i + k + len / 2] * curIm + im[i + k + len / 2] * curRe;
        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + len / 2] = uRe - vRe;
        im[i + k + len / 2] = uIm - vIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}

const FRAME = 2048;
const HOP = 512;

function hann(n: number): Float64Array {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  return w;
}

/** Magnitude spectrum per frame, hop-spaced. */
function spectrogram(x: Float32Array): Float64Array[] {
  const win = hann(FRAME);
  const frames: Float64Array[] = [];
  for (let start = 0; start + FRAME <= x.length; start += HOP) {
    const re = new Float64Array(FRAME);
    const im = new Float64Array(FRAME);
    for (let i = 0; i < FRAME; i++) re[i] = x[start + i] * win[i];
    fft(re, im);
    const mag = new Float64Array(FRAME / 2);
    for (let i = 0; i < FRAME / 2; i++) mag[i] = Math.hypot(re[i], im[i]);
    frames.push(mag);
  }
  return frames;
}

/**
 * Spectral centroid in Hz — the "centre of mass" of the spectrum, averaged
 * over frames.
 *
 * This is the measurement that catches a corrupt file outright. Music puts
 * most of its energy low; white noise spreads energy evenly, which drags the
 * centroid towards a quarter of the sample rate and keeps it there.
 */
export function spectralCentroid(x: Float32Array, sampleRate: number): number {
  const frames = spectrogram(x);
  if (frames.length === 0) return 0;
  const binHz = sampleRate / FRAME;
  let total = 0;
  let counted = 0;
  for (const mag of frames) {
    let num = 0;
    let den = 0;
    for (let i = 0; i < mag.length; i++) {
      num += i * binHz * mag[i];
      den += mag[i];
    }
    if (den > 1e-9) {
      total += num / den;
      counted++;
    }
  }
  return counted ? total / counted : 0;
}

/**
 * Onset strength over time: positive spectral flux, frame to frame.
 *
 * Rising energy in a bin means something started. Falling energy is just a
 * note decaying, so only the increases count.
 */
export function onsetEnvelope(x: Float32Array): Float64Array {
  const frames = spectrogram(x);
  const env = new Float64Array(Math.max(0, frames.length - 1));
  for (let t = 1; t < frames.length; t++) {
    let flux = 0;
    for (let i = 0; i < frames[t].length; i++) {
      const d = frames[t][i] - frames[t - 1][i];
      if (d > 0) flux += d;
    }
    env[t - 1] = flux;
  }
  return env;
}

export interface TempoEstimate {
  /** null when nothing periodic was found — a pad or a noise file. */
  bpm: number | null;
  /** 0-1. Peak autocorrelation relative to the envelope's own energy. */
  confidence: number;
  /**
   * How transient the material is: 95th percentile of onset strength over the
   * mean. Beat-driven material scores around 7, a sustained pad around 3, and
   * noise about 1.
   *
   * Measured against the mean rather than the median on purpose — cleanly
   * produced material can be digitally silent between hits, which puts the
   * median at exactly zero and makes the ratio meaningless.
   *
   * Autocorrelation alone is not enough to tell them apart — a smooth envelope
   * correlates well with itself at almost any lag, which is how a beatless pad
   * ends up "confidently" reporting a tempo it does not have.
   */
  percussiveness: number;
}

/** Minimum p95/mean onset ratio before a tempo is worth reporting. */
const PERCUSSIVE_FLOOR = 5;

/**
 * Tempo by autocorrelating the onset envelope.
 *
 * A steady four-on-the-floor kick makes the envelope repeat at the beat, so
 * the autocorrelation spikes at that lag. Material with no transients has no
 * spike to find, and saying so is more useful than returning a number anyway.
 */
export function estimateTempo(
  x: Float32Array,
  sampleRate: number,
  opts: { minBpm?: number; maxBpm?: number } = {},
): TempoEstimate {
  const minBpm = opts.minBpm ?? 70;
  const maxBpm = opts.maxBpm ?? 180;
  const env = onsetEnvelope(x);
  if (env.length < 16) return { bpm: null, confidence: 0, percussiveness: 0 };

  let envMean = 0;
  for (const v of env) envMean += v;
  envMean /= env.length;
  const sorted = Array.from(env).sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const percussiveness = envMean > 1e-12 ? p95 / envMean : 0;

  // Remove the mean so a loud-but-constant signal doesn't autocorrelate well.
  let mean = 0;
  for (const v of env) mean += v;
  mean /= env.length;
  const c = new Float64Array(env.length);
  for (let i = 0; i < env.length; i++) c[i] = env[i] - mean;

  let zero = 0;
  for (const v of c) zero += v * v;
  if (zero < 1e-9) return { bpm: null, confidence: 0, percussiveness };

  const framesPerSec = sampleRate / HOP;
  const lagFor = (bpm: number) => Math.round((60 / bpm) * framesPerSec);
  const minLag = Math.max(2, lagFor(maxBpm));
  const maxLag = Math.min(c.length - 1, lagFor(minBpm));

  let bestLag = -1;
  let bestVal = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0;
    for (let i = 0; i + lag < c.length; i++) s += c[i] * c[i + lag];
    // Normalise by overlap so short lags aren't favoured purely by sample count.
    const norm = s / (c.length - lag);
    if (norm > bestVal) {
      bestVal = norm;
      bestLag = lag;
    }
  }

  if (bestLag < 0) return { bpm: null, confidence: 0, percussiveness };
  const confidence = Math.max(0, Math.min(1, bestVal / (zero / c.length)));

  // No transients means no beat to find, however well the envelope happens to
  // correlate with itself.
  if (percussiveness < PERCUSSIVE_FLOOR || confidence < 0.12) {
    return { bpm: null, confidence, percussiveness };
  }

  // The lag is an integer number of hops, which quantises the tempo badly --
  // at 124 BPM one hop either way is more than a whole BPM. Fit a parabola
  // through the peak and its neighbours to recover the sub-hop position.
  const ac = (lag: number) => {
    if (lag < 1 || lag >= c.length) return 0;
    let s = 0;
    for (let i = 0; i + lag < c.length; i++) s += c[i] * c[i + lag];
    return s / (c.length - lag);
  };
  const yPrev = ac(bestLag - 1);
  const yPeak = bestVal;
  const yNext = ac(bestLag + 1);
  const denom = yPrev - 2 * yPeak + yNext;
  const shift = Math.abs(denom) > 1e-12 ? (0.5 * (yPrev - yNext)) / denom : 0;
  const refinedLag = bestLag + Math.max(-0.5, Math.min(0.5, shift));

  return {
    bpm: Math.round(((60 * framesPerSec) / refinedLag) * 10) / 10,
    confidence,
    percussiveness,
  };
}

/** Peak amplitude per bucket, for drawing the waveform. */
export function waveformPeaks(x: Float32Array, buckets = 220): number[] {
  const size = Math.max(1, Math.floor(x.length / buckets));
  const out: number[] = [];
  for (let b = 0; b < buckets; b++) {
    let peak = 0;
    const start = b * size;
    for (let i = start; i < Math.min(start + size, x.length); i++) {
      const v = Math.abs(x[i]);
      if (v > peak) peak = v;
    }
    out.push(peak);
  }
  return out;
}

export interface AudioAnalysis {
  durationS: number;
  sampleRate: number;
  rms: number;
  zcr: number;
  centroid: number;
  tempo: TempoEstimate;
  peaks: number[];
  /** Set when the measurements say this isn't music. */
  verdict: { broken: boolean; why: string };
}

/**
 * Is this a usable record, or a file that decoded to nothing?
 *
 * The Check stage catches files whose *length* contradicts their name. It
 * cannot catch a file that is the right length and still garbage — six minutes
 * of hiss passes every one of those rules. These two measurements do catch it,
 * and they need nothing but the audio itself.
 */
function judge(centroid: number, zcr: number, sampleRate: number): { broken: boolean; why: string } {
  // White noise sits near sampleRate/4 and crosses zero on roughly every other
  // sample. Music, whatever the genre, is nowhere near either.
  const centroidRatio = centroid / (sampleRate / 2);
  const zcrRatio = zcr / sampleRate;
  if (centroidRatio > 0.35 && zcrRatio > 0.2) {
    return {
      broken: true,
      why: `spectral centroid is ${Math.round(centroidRatio * 100)}% of Nyquist and the signal crosses zero ${Math.round(zcrRatio * 100)}% of all samples — energy spread evenly across the spectrum, which is noise, not a record`,
    };
  }
  return {
    broken: false,
    why: `energy is concentrated low (${Math.round(centroid)} Hz centre of mass) — consistent with music`,
  };
}

export function analyzeAudio(x: Float32Array, sampleRate: number): AudioAnalysis {
  const centroid = spectralCentroid(x, sampleRate);
  const zcr = zeroCrossingRate(x, sampleRate);
  return {
    durationS: x.length / sampleRate,
    sampleRate,
    rms: rms(x),
    zcr,
    centroid,
    tempo: estimateTempo(x, sampleRate),
    peaks: waveformPeaks(x),
    verdict: judge(centroid, zcr, sampleRate),
  };
}

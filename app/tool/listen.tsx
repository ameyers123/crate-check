"use client";

import { useCallback, useRef, useState } from "react";
import { analyzeAudio } from "@/lib/library/analyze-audio";
import type { AudioAnalysis } from "@/lib/library/analyze-audio";
import { STEP_BY_ID } from "@/lib/pipeline/steps";
import { Section } from "../sections/ui";

const CLIPS = [
  {
    file: "/audio/loop-124.mp3",
    name: "A four-on-the-floor loop",
    note: "Kick on every beat, hat on the offbeat, a bass line under it.",
    expect: "Should read as music, with a tempo.",
  },
  {
    file: "/audio/pad.mp3",
    name: "A beatless pad",
    note: "Stacked fifths that swell in and out. No transients anywhere.",
    expect: "Music, but there is no beat to find.",
  },
  {
    file: "/audio/noise.mp3",
    name: "A download that failed",
    note: "Six seconds of white noise, named and sized like a real track.",
    expect: "Every metadata check passes. It is not a record.",
  },
] as const;

function Waveform({ peaks, broken }: { peaks: number[]; broken: boolean }) {
  const max = Math.max(...peaks, 0.0001);
  return (
    <div className="flex h-20 items-center gap-px rounded-lg border border-edge/70 bg-background/40 px-2">
      {peaks.map((p, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${broken ? "bg-fail/60" : "bg-accent/70"}`}
          style={{ height: `${Math.max(2, (p / max) * 88)}%` }}
        />
      ))}
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-edge bg-background/40 p-3">
      <div className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">{label}</div>
      <div className="mt-1 font-mono text-lg">{value}</div>
      <div className="mt-1 text-[12px] leading-snug text-muted">{detail}</div>
    </div>
  );
}

export default function Listen() {
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<AudioAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const clip = CLIPS[idx];

  // Switching clips invalidates the reading, and leaving the old one on screen
  // next to a new filename would be a lie. Reset here, in the event that
  // causes it, rather than in an effect that runs a render later.
  const selectClip = (i: number) => {
    if (i === idx) return;
    setIdx(i);
    setResult(null);
    setError(null);
    audioRef.current?.pause();
    setPlaying(false);
  };

  const run = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(clip.file);
      if (!res.ok) throw new Error(`could not load the clip (${res.status})`);
      const bytes = await res.arrayBuffer();
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) throw new Error("this browser has no Web Audio support");
      const ctx = new Ctx();
      const buf = await ctx.decodeAudioData(bytes);
      setResult(analyzeAudio(buf.getChannelData(0), buf.sampleRate));
      void ctx.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "analysis failed");
    } finally {
      setBusy(false);
    }
  }, [clip.file]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  return (
    <Section
      n={STEP_BY_ID.analyze.n}
      id="listen"
      kicker="Analyze"
      title="Everything above starts from numbers. Here is where they come from."
      lede="These three clips are synthesized, not records — so they can ship here without anyone's rights attached. Press play, then analyze. The decoding, the FFT and the tempo estimate all run in this tab, on the actual samples."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {CLIPS.map((c, i) => (
          <button
            key={c.file}
            onClick={() => selectClip(i)}
            className={`rounded-lg border px-3 py-1.5 text-left text-[13px] transition-colors ${
              i === idx ? "border-foreground/40 bg-panel2" : "border-edge text-muted hover:text-foreground"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-edge bg-panel/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-medium">{clip.name}</h3>
            <p className="mt-1 text-[13px] text-muted">{clip.note}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={toggle}
              className="rounded-lg border border-edge px-3 py-2 text-[13px] transition-colors hover:border-foreground/40"
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={run}
              disabled={busy}
              className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-[13px] font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
            >
              {busy ? "Analyzing…" : "Analyze this clip →"}
            </button>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={clip.file}
          onEnded={() => setPlaying(false)}
          preload="none"
          className="hidden"
        />

        {error && <p className="mt-4 text-[13px] text-fail">{error}</p>}

        {result && (
          <div className="mt-5 border-t border-edge/70 pt-5">
            <Waveform peaks={result.peaks} broken={result.verdict.broken} />

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Tempo"
                value={result.tempo.bpm ? `${result.tempo.bpm} BPM` : "none found"}
                detail={
                  result.tempo.bpm
                    ? `autocorrelation of the onset envelope, confidence ${result.tempo.confidence.toFixed(2)}`
                    : `onset peaks only ${result.tempo.percussiveness.toFixed(1)}× the average — nothing periodic to lock onto`
                }
              />
              <Metric
                label="Centroid"
                value={`${Math.round(result.centroid)} Hz`}
                detail={`centre of mass of the spectrum — ${Math.round((result.centroid / (result.sampleRate / 2)) * 100)}% of Nyquist`}
              />
              <Metric
                label="Zero crossings"
                value={`${Math.round(result.zcr).toLocaleString()}/s`}
                detail="how often the waveform changes sign; hiss crosses constantly"
              />
              <Metric
                label="Level"
                value={result.rms.toFixed(3)}
                detail={`RMS over ${result.durationS.toFixed(1)}s at ${(result.sampleRate / 1000).toFixed(1)} kHz`}
              />
            </div>

            <div
              className={`mt-3 rounded-lg border p-4 text-[13px] leading-relaxed ${
                result.verdict.broken
                  ? "border-fail/30 bg-fail/[0.07] text-fail"
                  : "border-pass/25 bg-pass/[0.06] text-pass"
              }`}
            >
              <span className="font-medium">
                {result.verdict.broken ? "Not a record. " : "Reads as music. "}
              </span>
              <span className="text-foreground/75">{result.verdict.why}</span>
            </div>
          </div>
        )}

        {!result && !busy && (
          <p className="mt-4 text-[13px] text-muted">{clip.expect}</p>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-edge bg-panel/60 p-5">
        <h3 className="text-[15px] font-medium">Why this matters for the Check stage</h3>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted">
          The checks further up catch files whose <em>length contradicts their name</em> — a
          &ldquo;Radio Edit&rdquo; running eleven minutes, a three-minute single that is really a
          festival set. They are free, and they find a lot. But they are blind to the file above:
          six minutes of noise, named like a record and exactly the length a record should be,
          passes every one of them. Two measurements over the actual samples catch it in about a
          second. Knowing which checks are cheap and which need the audio is most of the work of
          deciding what to run, and when.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-review/25 bg-review/[0.07] p-5">
        <h3 className="text-[15px] font-medium">What this tab doesn&rsquo;t do: key</h3>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-foreground/80">
          Tempo is the easy measurement. Key is not: detectors disagree often on dance music.
          In a comparison of Rekordbox and Essentia on 100 tracks, both named the same key
          for 63. Another 18 were a step on the wheel or a relative major/minor apart, which
          still mixes. 19 were genuinely different, and neither tool is the ground truth.
        </p>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted">
          So crate-check never claims a key of its own. Keys come from Rekordbox or Mixed In
          Key. The keys in this demo&rsquo;s catalog are illustrative, and the engine behind it
          reports where detectors disagree instead of picking a winner.
        </p>
      </div>
    </Section>
  );
}

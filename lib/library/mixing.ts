/**
 * Mixing logic: what can follow what, and why.
 *
 * This is the part that turns a tagged library into something useful in a
 * booth. Four signals decide whether a record can follow the one playing, and
 * each is reported separately so you can overrule it — a clashing key is fine
 * if you're cutting rather than blending, and a big BPM jump is fine if the
 * next track opens beatless.
 */

import type { TaggedTrack } from "./types";

export type SignalVerdict = "good" | "ok" | "bad";

export interface Signal {
  label: string;
  verdict: SignalVerdict;
  detail: string;
}

export interface NextCandidate {
  track: TaggedTrack;
  score: number;
  signals: Signal[];
}

/* ------------------------------------------------------------------ keys -- */

export function parseCamelot(key: string): { n: number; letter: "A" | "B" } | null {
  const m = /^(\d{1,2})([AB])$/.exec(key.trim().toUpperCase());
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 1 || n > 12) return null;
  return { n, letter: m[2] as "A" | "B" };
}

const wrap = (n: number) => ((n - 1 + 12) % 12) + 1;

/**
 * The three moves that always work on the Camelot wheel: stay put, step one
 * round the wheel, or switch between the inner and outer ring at the same
 * number (relative minor/major).
 */
export function compatibleKeys(key: string): string[] {
  const k = parseCamelot(key);
  if (!k) return [];
  const other = k.letter === "A" ? "B" : "A";
  return [
    `${k.n}${k.letter}`,
    `${wrap(k.n - 1)}${k.letter}`,
    `${wrap(k.n + 1)}${k.letter}`,
    `${k.n}${other}`,
  ];
}

/** How far apart two keys are, in moves around the wheel. */
export function keyDistance(a: string, b: string): number | null {
  const ka = parseCamelot(a);
  const kb = parseCamelot(b);
  if (!ka || !kb) return null;
  const around = Math.min(Math.abs(ka.n - kb.n), 12 - Math.abs(ka.n - kb.n));
  const ringSwap = ka.letter === kb.letter ? 0 : 1;
  // Same number, different ring is one easy move, not a clash.
  if (around === 0) return ringSwap;
  return around + ringSwap;
}

function keySignal(from: string, to: string): Signal {
  const d = keyDistance(from, to);
  if (d === null) return { label: "Key", verdict: "ok", detail: "key unknown" };
  if (d === 0) return { label: "Key", verdict: "good", detail: `${from} → ${to}, same key` };
  if (d === 1)
    return { label: "Key", verdict: "good", detail: `${from} → ${to}, one move on the wheel` };
  if (d === 2)
    return { label: "Key", verdict: "ok", detail: `${from} → ${to}, two moves — some tension` };
  return { label: "Key", verdict: "bad", detail: `${from} → ${to}, ${d} moves apart — will clash` };
}

/* ------------------------------------------------------------------- bpm -- */

function bpmSignal(from: number, to: number): Signal {
  const pct = ((to - from) / from) * 100;
  const abs = Math.abs(pct);
  const dir = pct >= 0 ? "+" : "";
  const detail = `${from} → ${to} BPM (${dir}${pct.toFixed(1)}%)`;
  if (abs <= 3) return { label: "Tempo", verdict: "good", detail: `${detail}, comfortable` };
  if (abs <= 6) return { label: "Tempo", verdict: "ok", detail: `${detail}, a stretch` };
  return { label: "Tempo", verdict: "bad", detail: `${detail}, too far to ride` };
}

/* ---------------------------------------------------------------- energy -- */

function energySignal(from: number, to: number): Signal {
  const step = to - from;
  if (step === 0) return { label: "Energy", verdict: "good", detail: `holds at ${to}/10` };
  if (step === 1 || step === 2)
    return { label: "Energy", verdict: "good", detail: `${from} → ${to}/10, lifts` };
  if (step === -1)
    return { label: "Energy", verdict: "good", detail: `${from} → ${to}/10, eases off` };
  if (step >= 3) return { label: "Energy", verdict: "ok", detail: `${from} → ${to}/10, a jolt` };
  return { label: "Energy", verdict: "ok", detail: `${from} → ${to}/10, drops the room` };
}

/* ------------------------------------------------------------ mixability -- */

function introSignal(t: TaggedTrack): Signal {
  switch (t.features.intro) {
    case "beatless":
      return { label: "Intro", verdict: "good", detail: "beatless intro — bring it in anywhere" };
    case "long mixable":
      return { label: "Intro", verdict: "good", detail: "long mixable intro" };
    case "short":
      return { label: "Intro", verdict: "ok", detail: "short intro — be ready" };
    case "cold open":
      return { label: "Intro", verdict: "bad", detail: "cold open — cut, don't blend" };
  }
}

/* ----------------------------------------------------------------- score -- */

const WEIGHT: Record<SignalVerdict, number> = { good: 1, ok: 0.45, bad: 0 };

/**
 * Rank everything that could follow `current`.
 *
 * Key and tempo carry the most weight because they're the ones that make a
 * blend physically impossible rather than merely unwise.
 */
export function whatFitsNext(
  current: TaggedTrack,
  library: TaggedTrack[],
  opts: { limit?: number; phase?: string } = {},
): NextCandidate[] {
  const out: NextCandidate[] = [];

  for (const t of library) {
    if (t.id === current.id) continue;
    const signals = [
      keySignal(current.features.key, t.features.key),
      bpmSignal(current.features.bpm, t.features.bpm),
      energySignal(current.energy, t.energy),
      introSignal(t),
    ];

    let score =
      3.0 * WEIGHT[signals[0].verdict] +
      3.0 * WEIGHT[signals[1].verdict] +
      1.5 * WEIGHT[signals[2].verdict] +
      1.0 * WEIGHT[signals[3].verdict];

    if (opts.phase && t.tags.some((x) => x.name === opts.phase)) score += 1.2;

    out.push({ track: t, score, signals });
  }

  out.sort((a, b) => b.score - a.score || a.track.title.localeCompare(b.track.title));
  return out.slice(0, opts.limit ?? 6);
}

/* ------------------------------------------------------------- emergency -- */

export type Emergency = "floor_emptying" | "key_clash" | "tempo_jump";

export const EMERGENCY_COPY: Record<Emergency, { label: string; what: string }> = {
  floor_emptying: {
    label: "Floor is emptying",
    what: "Records the room will recognise inside a couple of bars, that you can mix into from here.",
  },
  key_clash: {
    label: "Key is clashing",
    what: "Instrumental, percussive tracks with no strong key centre — they sit under anything while you reset.",
  },
  tempo_jump: {
    label: "Need a tempo change",
    what: "Tracks that open beatless or at a different rhythmic feel, so you can move the tempo without dragging the floor through it.",
  },
};

export function emergencyOptions(
  current: TaggedTrack,
  library: TaggedTrack[],
  kind: Emergency,
): NextCandidate[] {
  const has = (t: TaggedTrack, name: string) => t.tags.some((x) => x.name === name);

  let pool = library.filter((t) => t.id !== current.id);

  if (kind === "floor_emptying") {
    pool = pool.filter((t) => has(t, "Floor Saver") || has(t, "Reset"));
  } else if (kind === "key_clash") {
    pool = pool.filter((t) => has(t, "Bridge / Tool"));
  } else {
    pool = pool.filter(
      (t) => t.features.intro === "beatless" || t.features.rhythm !== current.features.rhythm,
    );
  }

  const ranked = whatFitsNext(current, pool, { limit: 4 });
  // A tempo jump is the one case where the BPM signal being "bad" is the point.
  return kind === "tempo_jump"
    ? ranked
    : ranked.filter((c) => c.signals.every((s) => s.verdict !== "bad")).slice(0, 4);
}

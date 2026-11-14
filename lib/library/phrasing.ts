/**
 * Bars, phrases and where things happen inside a record.
 *
 * Dance music is built in blocks of 8, 16 and 32 bars, and the ear expects
 * changes on those boundaries. Two records with matched beats still sound
 * wrong together if the incoming one starts halfway through the outgoing
 * one's phrase — its drop then lands somewhere the floor isn't expecting it.
 *
 * One bar is four beats, so a bar lasts 240 / BPM seconds.
 */

import type { TaggedTrack, Track } from "./types";

export const secondsPerBar = (bpm: number) => 240 / bpm;
export const msPerBeat = (bpm: number) => 60000 / bpm;
export const barsIn = (seconds: number, bpm: number) => Math.round(seconds / secondsPerBar(bpm));

export type Alignment = "phrase" | "half-phrase" | "off";

/**
 * Where a start point sits relative to the phrase structure.
 * 32-bar boundary: lands where the record expects a change. 16: usually fine.
 * Anything else: the incoming record's phrases fight the outgoing one's.
 */
export function alignmentAt(bar: number): Alignment {
  if (bar % 32 === 0) return "phrase";
  if (bar % 16 === 0) return "half-phrase";
  return "off";
}

/** "bar 49" → "bar 17 of phrase 2". 0-indexed in, 1-indexed out, like a DJ counts. */
export function describeBar(bar: number): string {
  const phrase = Math.floor(bar / 32) + 1;
  const within = (bar % 32) + 1;
  return `bar ${within} of phrase ${phrase}`;
}

/** How many bars of runway the incoming record gives you before its groove arrives. */
export function introBars(track: Track): number {
  switch (track.features.intro) {
    case "beatless":
      return 32;
    case "long mixable":
      return 32;
    case "short":
      return 8;
    case "cold open":
      return 0;
  }
}

export type SectionKind = "intro" | "groove" | "breakdown" | "drop" | "outro";

export interface TrackSection {
  kind: SectionKind;
  startBar: number;
  bars: number;
}

export interface CuePoint {
  label: string;
  bar: number;
  /** The colour a CDJ hot-cue pad would show — purely cosmetic. */
  pad: "A" | "B" | "C" | "D" | "Loop";
}

export interface Structure {
  totalBars: number;
  sections: TrackSection[];
  cues: CuePoint[];
}

/**
 * A plausible arrangement for a record, built from what the catalog knows
 * about it: length, tempo, intro type and whether it has a breakdown.
 *
 * Illustrative — the analysis pass this catalog came from didn't extract
 * arrangements — but laid out the way dance records actually are: everything
 * in multiples of 8 bars, intro and outro sized for mixing.
 */
export function structureOf(track: Track): Structure {
  const f = track.features;
  const total = Math.max(64, Math.floor(barsIn(f.durationS, f.bpm) / 8) * 8);
  const intro = introBars(track);
  const outro = f.outro === "clean" ? 32 : 16;
  const breakdown = f.hasBreakdown ? 16 : 0;
  const drop = f.hasBreakdown ? 32 : 0;

  // Whatever's left is groove, split either side of the breakdown.
  const remaining = Math.max(16, total - intro - outro - breakdown - drop);
  const firstGroove = Math.max(16, Math.floor(remaining / 2 / 8) * 8);
  const secondGroove = Math.max(8, remaining - firstGroove);

  const sections: TrackSection[] = [];
  let at = 0;
  const push = (kind: SectionKind, bars: number) => {
    if (bars <= 0) return;
    sections.push({ kind, startBar: at, bars });
    at += bars;
  };
  push("intro", intro);
  push("groove", firstGroove);
  push("breakdown", breakdown);
  push("drop", drop);
  push("groove", secondGroove);
  push("outro", outro);

  const start = (k: SectionKind) => sections.find((s) => s.kind === k)?.startBar;
  const outroStart = start("outro") ?? at - outro;

  const cues: CuePoint[] = [{ label: "Mix in", bar: 0, pad: "A" }];
  const groove = start("groove");
  if (groove !== undefined && groove > 0) cues.push({ label: "Groove starts", bar: groove, pad: "B" });
  const bd = start("breakdown");
  if (bd !== undefined) cues.push({ label: "Breakdown", bar: bd, pad: "C" });
  const dr = start("drop");
  if (dr !== undefined) cues.push({ label: "Drop", bar: dr, pad: "D" });
  cues.push({ label: "Outro loop", bar: outroStart, pad: "Loop" });

  return { totalBars: at, sections, cues };
}

/** Deterministic per-track noise, so waveforms are stable across renders. */
function hashNoise(seed: string, i: number): number {
  let h = 2166136261 ^ i;
  for (let k = 0; k < seed.length; k++) {
    h ^= seed.charCodeAt(k);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const LEVEL: Record<SectionKind, number> = {
  intro: 0.42,
  groove: 0.74,
  breakdown: 0.28,
  drop: 0.95,
  outro: 0.5,
};

/**
 * One amplitude per bar, shaped by the arrangement. Illustrative — it shows
 * where the energy is, not the actual signal.
 */
export function waveformByBar(track: Track): number[] {
  const { sections } = structureOf(track);
  const beatless = track.features.intro === "beatless";
  const out: number[] = [];
  for (const s of sections) {
    for (let b = 0; b < s.bars; b++) {
      let base = LEVEL[s.kind];
      if (s.kind === "intro" && beatless) base = 0.2;
      // Builds rise into the next section; the last bars of a breakdown swell.
      if (s.kind === "breakdown") base += (b / s.bars) * 0.35;
      if (s.kind === "outro") base -= (b / s.bars) * 0.25;
      const n = hashNoise(`${track.artist}|${track.title}`, out.length);
      out.push(Math.max(0.06, Math.min(1, base + (n - 0.5) * 0.14)));
    }
  }
  return out;
}

/**
 * Where the incoming record's first full phrase begins, in its own bars.
 *
 * A 32-bar intro is itself a phrase, so phrases run from bar 1. An 8-bar
 * intro is a lead-in: the first phrase starts after it. That's why a record
 * with a short intro has to be started *early* — 8 bars before the boundary —
 * for its phrases to land on the outgoing record's.
 */
export function phraseAnchor(track: Track): number {
  const intro = introBars(track);
  return intro % 16 === 0 ? 0 : intro;
}

export interface TransitionPlan {
  /** Bar of the outgoing record where the incoming one starts. */
  startBar: number;
  /** Whether the incoming record's phrases line up with the outgoing one's. */
  alignment: Alignment;
  /** Bars between pressing play and the incoming record's first phrase. */
  anchorBars: number;
  overlapBars: number;
  /** Bar of the outgoing record where you swap the bass lines. */
  bassSwapBar: number;
  bassSwapAlignment: Alignment;
  /** Pitch change applied to the incoming record to match tempo, in percent. */
  pitchPct: number;
  /** Bars of the outgoing record left after the start point. */
  outgoingBarsLeft: number;
}

/**
 * What happens if you start the incoming record at `startBar` of the outgoing one.
 *
 * The bass swap goes where the incoming groove arrives, i.e. after its intro.
 * If the start point is off-phrase, so is the swap — which is exactly what
 * makes an off-phrase mix sound wrong even though the beats line up.
 */
export function planTransition(
  outgoing: TaggedTrack,
  incoming: TaggedTrack,
  startBar: number,
): TransitionPlan {
  const out = structureOf(outgoing);
  const left = Math.max(0, out.totalBars - startBar);
  const runway = introBars(incoming);
  const anchor = phraseAnchor(incoming);
  const overlap = Math.min(Math.max(runway, 8), left);
  const swap = startBar + Math.min(runway, overlap);
  return {
    startBar,
    alignment: alignmentAt(startBar + anchor),
    anchorBars: anchor,
    overlapBars: overlap,
    bassSwapBar: swap,
    bassSwapAlignment: alignmentAt(swap),
    pitchPct: ((outgoing.features.bpm - incoming.features.bpm) / incoming.features.bpm) * 100,
    outgoingBarsLeft: left,
  };
}

/**
 * The textbook start point: the incoming intro overlaps the outgoing outro,
 * and the incoming record's first phrase lands on a 32-bar boundary — which
 * for a short-intro record means pressing play a few bars before it.
 */
export function bestStartBar(outgoing: TaggedTrack, incoming: TaggedTrack): number {
  const { totalBars } = structureOf(outgoing);
  const anchor = phraseAnchor(incoming);
  const ideal = totalBars - Math.max(introBars(incoming), 16);
  const start = Math.floor((ideal + anchor) / 32) * 32 - anchor;
  return start >= 0 ? start : (32 - anchor) % 32;
}

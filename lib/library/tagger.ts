/**
 * The tagger: turns raw analyzer numbers into the vocabulary a DJ searches by.
 *
 * Two design choices worth stating.
 *
 * 1. **Thresholds are frozen, measured over a 3,500-track corpus.**
 *    A fixed 0.7 really would tag everything in a techno library and nothing in
 *    a disco one — but the fix for that is normalising the *input*, not making
 *    the *labels* relative. Percentiles of whatever array you happen to pass in
 *    mean a record re-tags when its neighbours change and a filtered playlist
 *    re-bases every cutoff against a handful of songs. So the bars live in
 *    `reference.ts` and don't move. `tagLibrary(tracks, { relativeTo: "library" })`
 *    still gives the relative reading for anyone who wants it.
 *
 * 2. **Tags overlap on purpose.** A track can be Tech House and Techno, Party
 *    and Hypnotic. Forcing one genre per track is what makes existing library
 *    tools useless for finding "that one record" — the single slot is always
 *    the wrong one.
 *
 * Every tag carries the rule and the numbers that produced it, so a tag you
 * disagree with can be argued with rather than just deleted.
 */

import type { Features, Tag, TaggedTrack, Track } from "./types";
import { GENRE_FAMILIES } from "./types";
import { REFERENCE_THRESHOLDS } from "./reference";

/** Percentile of a sorted array, linear interpolation. */
function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

const asc = (xs: number[]) => [...xs].sort((a, b) => a - b);
const r2 = (x: number) => Math.round(x * 1000) / 1000;

/** Library-wide cutoffs, computed once per library. */
export interface Thresholds {
  genre: Record<string, number>;
  mood: Record<string, { p75: number; p90: number; p67: number; p33: number; p50: number; p60: number }>;
  bpmMedian: number;
  danceP75: number;
}

export function computeThresholds(tracks: Track[]): Thresholds {
  const genre: Record<string, number> = {};
  for (const g of GENRE_FAMILIES) {
    genre[g] = pct(asc(tracks.map((t) => t.features.genre[g] ?? 0)), 0.75);
  }

  const moodKeys = [
    "party", "happy", "relaxed", "aggressive", "dark",
    "emotional", "groovy", "uplifting", "positive", "approachability",
  ] as const;

  const mood: Thresholds["mood"] = {};
  for (const k of moodKeys) {
    const s = asc(tracks.map((t) => t.features.mood[k]));
    mood[k] = {
      p33: pct(s, 0.33), p50: pct(s, 0.5), p60: pct(s, 0.6),
      p67: pct(s, 0.67), p75: pct(s, 0.75), p90: pct(s, 0.9),
    };
  }

  return {
    genre,
    mood,
    bpmMedian: pct(asc(tracks.map((t) => t.features.bpm)), 0.5),
    danceP75: pct(asc(tracks.map((t) => t.features.danceability)), 0.75),
  };
}

function genreTags(f: Features, th: Thresholds): Tag[] {
  const scored = GENRE_FAMILIES.map((g) => ({ g, v: f.genre[g] ?? 0 })).sort((a, b) => b.v - a.v);
  const top = scored[0]?.v ?? 0;
  const out: Tag[] = [];

  for (const { g, v } of scored) {
    // Must clear the library's own bar for this genre, and be competitive with
    // the track's strongest signal — otherwise every track collects a long tail
    // of weak genre tags.
    if (v >= th.genre[g] && v >= 0.55 * top) {
      out.push({
        name: g,
        group: "genre",
        trace: `${g}=${r2(v)} ≥ p75(${r2(th.genre[g])}) and ≥ 0.55×top(${r2(top)})`,
      });
    }
  }

  // The umbrella tag is noise once a more specific house subfamily has fired.
  const specific = ["Deep House", "Tech House", "Tropical / Sunset House"];
  if (out.some((t) => specific.includes(t.name))) {
    return out.filter((t) => t.name !== "House");
  }
  return out;
}

function vibeTags(f: Features, th: Thresholds): Tag[] {
  const m = f.mood;
  const out: Tag[] = [];
  const add = (name: string, trace: string) => out.push({ name, group: "vibe", trace });

  // Common moods: top quartile. These are meant to be reachable.
  if (m.party >= th.mood.party.p75) add("Party", `party=${r2(m.party)} ≥ p75(${r2(th.mood.party.p75)})`);
  if (m.happy >= th.mood.happy.p75) add("Happy", `happy=${r2(m.happy)} ≥ p75(${r2(th.mood.happy.p75)})`);
  if (m.relaxed >= th.mood.relaxed.p75) add("Relaxed", `relaxed=${r2(m.relaxed)} ≥ p75(${r2(th.mood.relaxed.p75)})`);

  // Character moods: top decile. A high bar on purpose — "Dark" should mean
  // something, and these heads skew low across the library.
  if (m.dark >= th.mood.dark.p90) add("Dark", `dark=${r2(m.dark)} ≥ p90(${r2(th.mood.dark.p90)})`);
  if (m.emotional >= th.mood.emotional.p90) add("Emotional", `emotional=${r2(m.emotional)} ≥ p90(${r2(th.mood.emotional.p90)})`);
  if (m.groovy >= th.mood.groovy.p90) add("Groovy", `groovy=${r2(m.groovy)} ≥ p90(${r2(th.mood.groovy.p90)})`);
  if (m.aggressive >= th.mood.aggressive.p90) add("Aggressive", `aggressive=${r2(m.aggressive)} ≥ p90(${r2(th.mood.aggressive.p90)})`);

  // Composites: no single model head means "hypnotic", so it's built from the
  // combination that actually describes it — repetitive, not aggressive, and
  // not especially approachable.
  const techFamily = Math.max(
    f.genre["Techno"] ?? 0,
    f.genre["Tech House"] ?? 0,
    f.genre["Melodic House & Techno"] ?? 0,
  );
  if (
    techFamily >= th.genre["Techno"] &&
    m.approachability <= th.mood.approachability.p33 &&
    m.aggressive < th.mood.aggressive.p75
  ) {
    add("Hypnotic", `techno-family=${r2(techFamily)} high, approachability=${r2(m.approachability)} ≤ p33, not top-quartile aggressive`);
  }

  const lift = (m.uplifting + m.positive + m.happy) / 3;
  if (lift >= th.mood.uplifting.p90 && m.aggressive <= th.mood.aggressive.p50) {
    add("Euphoric", `mean(uplifting, positive, happy)=${r2(lift)} ≥ p90, aggressive below median`);
  }

  return out;
}

function functionTags(f: Features, th: Thresholds): Tag[] {
  const m = f.mood;
  const out: Tag[] = [];
  const add = (name: string, trace: string) => out.push({ name, group: "function", trace });

  if (f.vocal >= 0.5) add("Vocal", `vocal_instrumental=${r2(f.vocal)} ≥ 0.5`);
  else add("Instrumental", `vocal_instrumental=${r2(f.vocal)} < 0.5`);

  // Where in a night this track belongs. These are the tags that make a set
  // buildable, and none of them exist in standard DJ software.
  if (
    m.relaxed >= th.mood.relaxed.p67 &&
    m.aggressive <= th.mood.aggressive.p33 &&
    m.party <= th.mood.party.p33 &&
    f.bpm <= th.bpmMedian
  ) {
    add("Warm-up", `relaxed ≥ p67, aggressive ≤ p33, party ≤ p33, bpm ${f.bpm} ≤ median(${Math.round(th.bpmMedian)})`);
  }

  const techFamily = Math.max(
    f.genre["Techno"] ?? 0,
    f.genre["Tech House"] ?? 0,
    f.genre["Melodic House & Techno"] ?? 0,
  );
  if (techFamily >= th.genre["Tech House"] && f.bpm >= th.bpmMedian && m.aggressive >= th.mood.aggressive.p33) {
    add("Driving", `techno-family=${r2(techFamily)} ≥ p60, bpm ${f.bpm} ≥ median, aggressive ≥ p33`);
  }

  if (m.party >= th.mood.party.p75 && f.danceability >= th.danceP75 && m.aggressive >= th.mood.aggressive.p50) {
    add("Peak", `party ≥ p75, danceability=${r2(f.danceability)} ≥ p75, aggressive ≥ median`);
  }

  if (
    m.relaxed >= th.mood.relaxed.p67 &&
    m.approachability <= th.mood.approachability.p33 &&
    m.party <= th.mood.party.p50 &&
    m.aggressive <= th.mood.aggressive.p50
  ) {
    add("Afterhours", `relaxed ≥ p67, approachability ≤ p33, party and aggressive both below median`);
  }

  return out;
}

/**
 * Energy, 1-10.
 *
 * The most-used field in any DJ library, and the one no analyzer outputs
 * directly. It's a blend of how hard a record hits (aggressive), how much it
 * asks the floor to move (party, danceability) and how fast it is.
 */
export function energyOf(f: Features, th: Thresholds): { energy: number; trace: string } {
  const m = f.mood;
  const bpmPart = Math.max(0, Math.min(1, (f.bpm - 100) / 40));
  const raw =
    0.34 * m.party + 0.28 * m.aggressive + 0.18 * f.danceability + 0.20 * bpmPart;
  const energy = Math.max(1, Math.min(10, Math.round(raw * 12)));
  return {
    energy,
    trace: `party ${r2(m.party)} · aggressive ${r2(m.aggressive)} · danceability ${r2(f.danceability)} · ${f.bpm} BPM`,
  };
}

/** The back-pocket roles. Each is a composite of the fields above. */
function roleTags(f: Features, energy: number, fnTags: Tag[]): Tag[] {
  const out: Tag[] = [];
  const add = (name: string, trace: string) => out.push({ name, group: "role", trace });
  const isPeak = fnTags.some((t) => t.name === "Peak");
  const known = f.familiarity === "anthem" || f.familiarity === "known";

  // Guaranteed reaction: the floor knows it and it hits hard.
  if (known && energy >= 8 && isPeak) {
    add("Floor Saver", `${f.familiarity}, energy ${energy}/10, tagged Peak`);
  }
  // Re-engages a room that has drifted — recognition does the work, not volume.
  if (f.familiarity === "anthem" && f.vocalDetail !== "none") {
    add("Reset", `anthem with a ${f.vocalDetail} vocal — recognised in a couple of bars`);
  }
  // Sits under almost anything: no vocal to clash, no strong key centre.
  if (f.vocalDetail === "none" && f.rhythm === "four-on-the-floor" && f.mood.emotional < 0.45) {
    add("Bridge / Tool", `instrumental, four-on-the-floor, low melodic content — mixes under a key clash`);
  }
  // Can come in almost anywhere without a hard beatmatch.
  if (f.intro === "beatless" || f.intro === "long mixable") {
    add("Safe Drop", `${f.intro} intro — you can bring it in without a tight beatmatch`);
  }
  return out;
}

export function tagTrack(track: Track, th: Thresholds): TaggedTrack {
  const fnTags = functionTags(track.features, th);
  const { energy, trace } = energyOf(track.features, th);
  return {
    ...track,
    energy,
    energyTrace: trace,
    tags: [
      ...genreTags(track.features, th),
      ...vibeTags(track.features, th),
      ...fnTags,
      ...roleTags(track.features, energy, fnTags),
    ],
  };
}

/**
 * Tag a set of tracks.
 *
 * Defaults to the frozen reference cutoffs, so a record tags the same way
 * regardless of what else happens to be in the array. Pass
 * `{ relativeTo: "library" }` for the other reading — "dark *for this
 * collection*" — which is a genuine question, just not the default one.
 */
export function tagLibrary(
  tracks: Track[],
  opts: { relativeTo?: "reference" | "library" } = {},
): { tracks: TaggedTrack[]; thresholds: Thresholds } {
  const thresholds =
    opts.relativeTo === "library" ? computeThresholds(tracks) : REFERENCE_THRESHOLDS;
  return { tracks: tracks.map((t) => tagTrack(t, thresholds)), thresholds };
}

export const hasTag = (t: TaggedTrack, name: string) => t.tags.some((x) => x.name === name);

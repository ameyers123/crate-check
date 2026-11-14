/**
 * Turn catalog rows into full `Track`s.
 *
 * The catalog carries the *output* of a real analysis pass — the genre, vibe
 * and function tags that pass produced. To keep the analyze-and-tag demo
 * honest (the tagger running live rather than reading a cached answer), the
 * feature values here are reconstructed so that re-running the tagger over
 * them lands back on the same tags.
 *
 * So: the tags are real, the numbers behind them are a faithful reconstruction
 * rather than the original floats, and the tagger genuinely re-derives.
 */

import { CATALOG } from "./catalog";
import type { CatalogRow } from "./catalog";
import type { Features, RhythmFeel, Track } from "./types";
import { GENRE_FAMILIES } from "./types";

const BROKEN_RHYTHM = new Set(["Breaks", "Drum & Bass", "Hip-Hop / Rap"]);

function rhythmFor(row: CatalogRow): RhythmFeel {
  if (row.genre.some((g) => BROKEN_RHYTHM.has(g))) return row.bpm < 100 ? "halftime" : "broken";
  if (row.genre.includes("Disco / Nu-Disco")) return "swung";
  return "four-on-the-floor";
}

/** Extended mixes run long; radio edits run short. */
function durationFor(row: CatalogRow): number {
  if (/extended/i.test(row.title)) return 360 + Math.round((row.bpm % 7) * 12);
  if (/radio edit/i.test(row.title)) return 190 + Math.round((row.bpm % 5) * 6);
  return 280 + Math.round((row.bpm % 9) * 10);
}

/**
 * Deterministic per-track jitter.
 *
 * Without this every un-flagged track gets an identical default mood value,
 * the percentile thresholds collapse onto that value, and tags like "Dark"
 * fire on the whole library. Real analysis output has spread; the
 * reconstruction needs it too.
 */
function jitter(seed: string, spread: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 2 * spread;
}

export function rowToTrack(row: CatalogRow, i: number): Track {
  const has = (list: string[], name: string) => list.includes(name);
  const j = (field: string, spread = 0.16) => jitter(`${row.artist}|${row.title}|${field}`, spread);
  const clamp = (x: number) => Math.max(0.01, Math.min(0.99, x));

  // Genre: listed families sit clearly above the bar, everything else below it.
  const genre: Record<string, number> = {};
  for (const g of GENRE_FAMILIES) genre[g] = 0.06;
  row.genre.forEach((g, idx) => {
    genre[g] = idx === 0 ? 0.66 : 0.52;
  });

  const vibe = row.vibe;
  // A flagged vibe sits clearly above the library's bar; an unflagged one gets
  // a spread-out middling value so the percentiles stay meaningful.
  const lvl = (name: string, hi: number, lo: number, field = name) =>
    clamp(has(vibe, name) ? hi + j(field, 0.05) : lo + j(field));

  const party = clamp(
    has(vibe, "Party") ? 0.9 + j("party", 0.05) : has(vibe, "Relaxed") ? 0.18 + j("party", 0.1) : 0.45 + j("party"),
  );
  const relaxed = clamp(
    has(vibe, "Relaxed") ? 0.9 + j("relaxed", 0.05) : has(vibe, "Party") ? 0.16 + j("relaxed", 0.1) : 0.4 + j("relaxed"),
  );
  const aggressive = clamp(
    has(vibe, "Aggressive") ? 0.93 + j("agg", 0.04) : has(vibe, "Relaxed") ? 0.08 + j("agg", 0.06) : 0.32 + j("agg"),
  );

  const mood: Features["mood"] = {
    party,
    happy: lvl("Happy", 0.92, 0.38, "happy"),
    relaxed,
    aggressive,
    dark: lvl("Dark", 0.95, 0.24, "dark"),
    emotional: lvl("Emotional", 0.95, 0.28, "emo"),
    groovy: lvl("Groovy", 0.95, 0.36, "groovy"),
    uplifting: lvl("Euphoric", 0.95, 0.38, "uplift"),
    positive: clamp(
      has(vibe, "Happy") || has(vibe, "Euphoric") ? 0.88 + j("pos", 0.05) : 0.44 + j("pos"),
    ),
    // Hypnotic reads as "not especially approachable" — repetitive, underground.
    approachability: clamp(has(vibe, "Hypnotic") ? 0.12 + j("appr", 0.05) : 0.56 + j("appr")),
  };

  const features: Features = {
    bpm: row.bpm,
    key: row.key,
    durationS: durationFor(row),
    danceability: row.danceability,
    vocal: row.vocal === "voice" ? 0.82 : 0.14,
    genre,
    mood,
    intro: row.intro,
    outro: row.outro,
    familiarity: row.familiarity,
    vocalDetail: row.vocalDetail,
    rhythm: rhythmFor(row),
    hasBreakdown: !row.genre.includes("Techno") || has(vibe, "Emotional"),
  };

  return {
    id: `c${String(i + 1).padStart(3, "0")}`,
    artist: row.artist,
    title: row.title,
    features,
  };
}

export function buildCatalog(): Track[] {
  return CATALOG.map(rowToTrack);
}

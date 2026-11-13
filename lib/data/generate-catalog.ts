/**
 * Synthetic catalog generator.
 *
 * Produces a fictional catalog plus the candidate each track's source
 * "returned", with the real-world failure taxonomy deliberately seeded so the
 * demo exercises every interesting path.
 *
 * Everything here is invented. Artists, titles and ISRCs are generated from
 * word banks; ISRCs use the ZZ country code, which is reserved and never
 * issued, so no synthetic identifier can collide with a real recording.
 *
 * Deterministic: same seed, same catalog. Run `npm run generate` to rebuild.
 */

import type { Candidate, CatalogTrack, VersionClass } from "../engine/types";

export type Scenario =
  | "clean"
  | "original_mix_label"
  | "dj_set_rip"
  | "acapella"
  | "extended_for_original"
  | "snippet"
  | "live_cut"
  | "unnamed_remixer_exact"
  | "fuzzy_remixer"
  | "no_provenance"
  | "missing";

export interface CatalogEntry {
  track: CatalogTrack;
  candidate: Candidate | null;
  /** Why this entry exists. Shown in the UI to explain each case. */
  scenario: Scenario;
}

/** mulberry32 — small, fast, deterministic. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ARTIST_A = [
  "Kolm", "Varda", "Sable", "Noct", "Mirrea", "Halden", "Pell", "Orva",
  "Tessel", "Brume", "Caldo", "Niva", "Shor", "Lumen", "Adrift", "Vayle",
  "Kestrel", "Onda", "Plume", "Serac", "Tombo", "Ulva", "Wyre", "Zonda",
];
const ARTIST_B = [
  "Hale", "Zeru", "Mont", "Avery", "Kade", "Soren", "Lis", "Toma",
  "Rue", "Delos", "Ferro", "Ines", "Juno", "Kirin", "Lora", "Mesa",
];
const TITLE_A = [
  "Night", "Paper", "Slow", "Velvet", "Glass", "Copper", "Low", "Warm",
  "Static", "Harbor", "Neon", "Quiet", "Amber", "Hollow", "Drift", "Salt",
  "Iron", "Pale", "Cobalt", "Dusty", "Open", "Soft", "Tidal", "Wild",
];
const TITLE_B = [
  "Drive", "Hours", "Lines", "Weather", "Signal", "Rooms", "Water", "Light",
  "Motion", "Garden", "Circuit", "Mornings", "Tape", "Shoreline", "Pulse",
  "Echo", "Frame", "Hum", "Current", "Season", "Window", "Orbit",
];
const REMIXERS = [
  "Rylo", "Delphi", "Oskar Vane", "Noor", "Hartline", "Petra Oyo",
  "Cassio", "Mondo Bay", "Lune", "Ferris Tate", "Sable", "Kov",
];
const EDIT_FORMS = ["Radio Edit", "Extended Mix", "Club Mix", "Dub Mix"];

function pick<T>(r: () => number, xs: readonly T[]): T {
  return xs[Math.floor(r() * xs.length)];
}

function makeIsrc(r: () => number, i: number): string {
  const reg = "Q" + pick(r, ["A", "B", "C", "D", "E"]) + pick(r, ["1", "2", "7", "9"]);
  return `ZZ${reg}26${String(i).padStart(5, "0")}`;
}

/**
 * Scenario mix. Roughly mirrors the distribution seen in the private run that
 * motivated this tool: most matches are fine, and the failures cluster into a
 * handful of recognisable shapes.
 */
const MIX: [Scenario, number][] = [
  ["clean", 86],
  ["original_mix_label", 9],
  ["dj_set_rip", 12],
  ["acapella", 3],
  ["extended_for_original", 9],
  ["snippet", 8],
  ["live_cut", 4],
  ["unnamed_remixer_exact", 8],
  ["fuzzy_remixer", 4],
  ["no_provenance", 6],
  ["missing", 5],
];

function scenarioPlan(): Scenario[] {
  const out: Scenario[] = [];
  for (const [s, n] of MIX) for (let i = 0; i < n; i++) out.push(s);
  return out;
}

function versionClassFor(s: Scenario, r: () => number): VersionClass {
  switch (s) {
    case "unnamed_remixer_exact":
    case "fuzzy_remixer":
      return "distinct_remix";
    case "original_mix_label":
    case "extended_for_original":
    case "acapella":
    case "live_cut":
      return "original";
    default:
      return pick(r, ["original", "original", "original", "distinct_remix", "edit_or_extended"]);
  }
}

export function generateCatalog(seed = 20260413): CatalogEntry[] {
  const r = rng(seed);
  const plan = scenarioPlan();
  // Deterministic shuffle so scenarios are interleaved, not grouped.
  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [plan[i], plan[j]] = [plan[j], plan[i]];
  }

  return plan.map((scenario, i) => {
    const artist =
      r() < 0.28
        ? `${pick(r, ARTIST_A)}, ${pick(r, ARTIST_B)}`
        : `${pick(r, ARTIST_A)} ${pick(r, ARTIST_B)}`;
    const baseTitle = `${pick(r, TITLE_A)} ${pick(r, TITLE_B)}`;
    const versionClass = versionClassFor(scenario, r);

    let versionText = "";
    if (versionClass === "distinct_remix") versionText = `${pick(r, REMIXERS)} Remix`;
    else if (versionClass === "edit_or_extended") versionText = pick(r, EDIT_FORMS);

    const title = versionText ? `${baseTitle} - ${versionText}` : baseTitle;
    const expectedDurationS = Math.round(165 + r() * 240); // ~2:45 to ~6:45

    const track: CatalogTrack = {
      id: `trk_${String(i + 1).padStart(4, "0")}`,
      isrc: makeIsrc(r, i + 1),
      artist,
      title,
      baseTitle,
      versionText,
      versionClass,
      expectedDurationS,
    };

    return { track, candidate: buildCandidate(track, scenario, r), scenario };
  });
}

/** Construct the candidate a source would have returned under this scenario. */
function buildCandidate(
  track: CatalogTrack,
  scenario: Scenario,
  r: () => number,
): Candidate | null {
  const sourceId = `src_${track.id.slice(4)}`;
  const nameLine = `${track.artist} - ${track.baseTitle}`;
  // A correct file is never bit-identical in length to the catalog figure;
  // a second or two of drift is normal and must not trip the gate.
  const jitter = () => (r() - 0.5) * 3;

  const exact = (title: string, mult = 1, extra = 0): Candidate => {
    const d = Math.round(track.expectedDurationS * mult + extra + jitter());
    return { sourceId, title, durationS: d, measuredDurationS: d };
  };

  switch (scenario) {
    case "clean":
      return exact(track.versionText ? `${nameLine} (${track.versionText})` : nameLine);

    case "original_mix_label":
      // Correct recording, labelled the way dance releases are labelled.
      return exact(`${nameLine} (Original Mix)`);

    case "dj_set_rip":
      // The headline case: title reads correctly, audio is a whole set segment.
      return exact(`${nameLine}`, 1.8 + r() * 0.6);

    case "acapella":
      return exact(`${nameLine} (Acappella)`, 1.1 + r() * 0.2);

    case "extended_for_original":
      return exact(`${nameLine} (Extended Mix)`, 1.35 + r() * 0.25);

    case "snippet":
      return exact(`${nameLine}`, 0.55 + r() * 0.15);

    case "live_cut":
      return exact(`${nameLine} (Live at Hale Street)`, 1.0 + r() * 0.08);

    case "unnamed_remixer_exact": {
      // Right length to the second, but the upload never names the remixer.
      const d = Math.round(track.expectedDurationS + (r() - 0.5) * 2);
      return { sourceId, title: nameLine, durationS: d, measuredDurationS: d };
    }

    case "fuzzy_remixer": {
      const remixer = track.versionText.replace(/\s*Remix\s*$/i, "");
      const smudged = remixer.length > 4 ? remixer.slice(0, -1) + "e" : remixer + "e";
      return exact(`${nameLine} (${smudged} Rmx)`);
    }

    case "no_provenance": {
      // Provenance lookup failed. Audio is fine; we just cannot corroborate.
      const d = Math.round(track.expectedDurationS + jitter());
      return { sourceId, title: "", durationS: null, measuredDurationS: d };
    }

    case "missing":
      return null;
  }
}

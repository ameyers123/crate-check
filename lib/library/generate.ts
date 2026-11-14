/**
 * Sample library generator.
 *
 * Produces a fictional but realistically-shaped house/techno library: BPM
 * clustered where dance music actually sits, mood profiles that correlate the
 * way real ones do (aggressive tracks are rarely relaxed), and a handful of
 * deliberately broken files so the audit view has something to find.
 *
 * Artists and titles are invented. Deterministic for a given seed.
 */

import type { Features, Track } from "./types";
import { GENRE_FAMILIES } from "./types";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const A1 = ["Kolm","Varda","Sable","Noct","Mirrea","Halden","Pell","Orva","Tessel","Brume","Caldo","Niva","Shor","Lumen","Vayle","Kestrel","Onda","Plume","Serac","Ulva","Wyre","Zonda","Fenna","Adria","Rhone","Calder"];
const A2 = ["Hale","Zeru","Mont","Avery","Kade","Soren","Lis","Toma","Rue","Delos","Ferro","Ines","Juno","Kirin","Lora","Mesa","Vero","Ardo"];
const T1 = ["Night","Paper","Slow","Velvet","Glass","Copper","Low","Warm","Static","Harbor","Neon","Quiet","Amber","Hollow","Drift","Salt","Iron","Pale","Cobalt","Open","Soft","Tidal","Dust","Marble","Violet","Ridge"];
const T2 = ["Drive","Hours","Lines","Weather","Signal","Rooms","Water","Light","Motion","Garden","Circuit","Tape","Shoreline","Pulse","Echo","Frame","Hum","Current","Season","Window","Orbit","Theory","Static","Bloom"];

const KEYS = ["1A","2A","3A","4A","5A","6A","7A","8A","9A","10A","11A","12A","1B","2B","3B","4B","5B","6B","7B","8B","9B","10B","11B","12B"];

const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** Rough normal via sum of uniforms. */
const gauss = (r: () => number, mean: number, sd: number) =>
  mean + ((r() + r() + r() + r() - 2) / 2) * sd * 2;

/** The archetypes real house/techno libraries cluster into. */
type Archetype = "deep" | "tech" | "techno" | "melodic" | "tropical" | "disco" | "bass" | "breaks" | "trance";

const ARCHETYPES: [Archetype, number][] = [
  ["deep", 20], ["tech", 18], ["techno", 16], ["melodic", 13],
  ["tropical", 10], ["disco", 11], ["bass", 7], ["breaks", 3], ["trance", 4],
];

function weightedPick<T>(r: () => number, ws: [T, number][]): T {
  const total = ws.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [v, w] of ws) { x -= w; if (x <= 0) return v; }
  return ws[ws.length - 1][0];
}

/** BPM centre and mood tendencies per archetype. */
const PROFILE: Record<Archetype, { bpm: number; genre: Partial<Record<string, number>>; mood: Partial<Record<string, number>> }> = {
  deep:     { bpm: 122, genre: { "Deep House": 0.62, House: 0.45 }, mood: { relaxed: 0.66, groovy: 0.55, aggressive: 0.12, approachability: 0.6 } },
  tech:     { bpm: 127, genre: { "Tech House": 0.60, House: 0.38 }, mood: { party: 0.70, aggressive: 0.42, groovy: 0.58, approachability: 0.5 } },
  techno:   { bpm: 132, genre: { Techno: 0.68 }, mood: { aggressive: 0.60, dark: 0.62, relaxed: 0.18, approachability: 0.26 } },
  melodic:  { bpm: 124, genre: { "Melodic House & Techno": 0.63, Techno: 0.30 }, mood: { emotional: 0.64, uplifting: 0.58, dark: 0.40, approachability: 0.38 } },
  tropical: { bpm: 118, genre: { "Tropical / Sunset House": 0.64, House: 0.36 }, mood: { happy: 0.70, relaxed: 0.64, positive: 0.70, aggressive: 0.10 } },
  disco:    { bpm: 120, genre: { "Disco / Nu-Disco": 0.66 }, mood: { happy: 0.72, groovy: 0.70, party: 0.60, positive: 0.72 } },
  bass:     { bpm: 128, genre: { "Bass House": 0.62, "Tech House": 0.32 }, mood: { aggressive: 0.66, party: 0.68, dark: 0.45 } },
  breaks:   { bpm: 134, genre: { Breaks: 0.60 }, mood: { party: 0.58, aggressive: 0.45, groovy: 0.52 } },
  trance:   { bpm: 136, genre: { Trance: 0.64, "Melodic House & Techno": 0.3 }, mood: { uplifting: 0.74, emotional: 0.62, positive: 0.68 } },
};

function buildFeatures(r: () => number, arch: Archetype): Features {
  const p = PROFILE[arch];
  const genre: Record<string, number> = {};
  for (const g of GENRE_FAMILIES) {
    genre[g] = clamp01(gauss(r, p.genre[g] ?? 0.1, p.genre[g] ? 0.1 : 0.07));
  }

  const base = (k: string, fallback: number) => clamp01(gauss(r, p.mood[k] ?? fallback, 0.14));
  const aggressive = base("aggressive", 0.3);
  const mood = {
    party: base("party", 0.45),
    happy: base("happy", 0.42),
    // Relaxed and aggressive pull against each other, as they do in practice.
    relaxed: clamp01(base("relaxed", 0.4) * (1 - aggressive * 0.55)),
    aggressive,
    dark: base("dark", 0.3),
    emotional: base("emotional", 0.35),
    groovy: base("groovy", 0.42),
    uplifting: base("uplifting", 0.4),
    positive: base("positive", 0.45),
    approachability: base("approachability", 0.45),
  };

  const vocal = r() < 0.55 ? clamp01(gauss(r, 0.75, 0.15)) : clamp01(gauss(r, 0.22, 0.14));
  return {
    bpm: Math.round(gauss(r, p.bpm, 3) * 2) / 2,
    key: pick(r, KEYS),
    durationS: Math.round(gauss(r, 330, 70)),
    danceability: clamp01(gauss(r, 0.9, 0.08)),
    vocal,
    genre,
    mood,
    intro: pick(r, ["beatless", "long mixable", "short", "cold open"] as const),
    outro: r() < 0.7 ? "clean" : "fade",
    familiarity: pick(r, ["anthem", "known", "deep cut", "deep cut"] as const),
    vocalDetail: vocal >= 0.5 ? pick(r, ["male", "female", "spoken", "chopped"] as const) : "none",
    rhythm: arch === "breaks" ? "broken" : arch === "disco" ? "swung" : "four-on-the-floor",
    hasBreakdown: r() < 0.7,
  };
}

export function generateLibrary(seed = 90210, n = 240): Track[] {
  const r = rng(seed);
  const tracks: Track[] = [];

  for (let i = 0; i < n; i++) {
    const arch = weightedPick(r, ARCHETYPES);
    const artist = r() < 0.25 ? `${pick(r, A1)}, ${pick(r, A2)}` : `${pick(r, A1)} ${pick(r, A2)}`;
    const title = `${pick(r, T1)} ${pick(r, T2)}`;
    const features = buildFeatures(r, arch);
    tracks.push({ id: `t${String(i + 1).padStart(4, "0")}`, artist, title, features });
  }

  // Deliberately broken files, so the audit view has real work to do. Each one
  // is a shape that actually turns up when files are collected in bulk.
  const defects: { kind: NonNullable<Track["defect"]>["kind"]; claims: string; dur: number; titleSuffix?: string }[] = [
    { kind: "set_rip", claims: "a single", dur: 2840 },
    { kind: "set_rip", claims: "a single", dur: 3610 },
    { kind: "set_rip", claims: "a single", dur: 2410 },
    { kind: "clip", claims: "the full track", dur: 61 },
    { kind: "clip", claims: "the full track", dur: 48 },
    { kind: "wrong_edit_length", claims: "Radio Edit", dur: 512, titleSuffix: " - Radio Edit" },
    { kind: "wrong_edit_length", claims: "Radio Edit", dur: 603, titleSuffix: " - Radio Edit" },
    { kind: "wrong_edit_length", claims: "Extended Mix", dur: 166, titleSuffix: " - Extended Mix" },
  ];

  defects.forEach((d, i) => {
    const t = tracks[i * 17 + 3];
    if (!t) return;
    t.features.durationS = d.dur;
    if (d.titleSuffix) t.title += d.titleSuffix;
    t.defect = { kind: d.kind, claims: d.claims };
  });

  // A duplicate pair: same record, two very different files. One is wrong.
  const src = tracks[90];
  if (src) {
    tracks.push({
      id: "t9001",
      artist: src.artist,
      title: src.title,
      features: { ...src.features, durationS: Math.round(src.features.durationS * 2.4) },
      defect: { kind: "duplicate_mismatch", claims: "the same track you already own" },
    });
  }

  return tracks;
}

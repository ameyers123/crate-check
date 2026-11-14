/**
 * A DJ library track: what the analyzer measures, and what the tagger derives.
 *
 * The split matters. `Features` are raw model outputs — numbers with no
 * opinion. `Tags` are the vocabulary a DJ actually searches by. Keeping them
 * apart is what makes the tagging explainable: every tag can point at the
 * numbers and the threshold that produced it.
 */

/** Raw analyzer output. Mirrors the shape a real audio-tagging pass produces. */
export interface Features {
  bpm: number;
  /** Camelot notation, e.g. "8A" — adjacent numbers mix harmonically. */
  key: string;
  durationS: number;
  danceability: number;
  vocal: number;
  /** Genre-family probabilities, 0-1. */
  genre: Record<string, number>;
  /** Mood/theme probabilities, 0-1. */
  mood: {
    party: number;
    happy: number;
    relaxed: number;
    aggressive: number;
    dark: number;
    emotional: number;
    groovy: number;
    uplifting: number;
    positive: number;
    approachability: number;
  };
}

export interface Track {
  id: string;
  artist: string;
  title: string;
  features: Features;
  /** Set when this file is deliberately not what it claims — drives the audit view. */
  defect?: {
    kind: "set_rip" | "clip" | "wrong_edit_length" | "duplicate_mismatch";
    claims: string;
  };
}

/** One tag plus the reason it fired. */
export interface Tag {
  name: string;
  group: "genre" | "vibe" | "function";
  /** The rule and the numbers behind it, in the analyzer's own terms. */
  trace: string;
}

export interface TaggedTrack extends Track {
  tags: Tag[];
}

export const GENRE_FAMILIES = [
  "House",
  "Deep House",
  "Tech House",
  "Techno",
  "Melodic House & Techno",
  "Tropical / Sunset House",
  "Disco / Nu-Disco",
  "Bass House",
  "Breaks",
  "Trance",
] as const;

export const VIBE_TAGS = [
  "Party",
  "Happy",
  "Relaxed",
  "Hypnotic",
  "Aggressive",
  "Dark",
  "Emotional",
  "Groovy",
  "Euphoric",
] as const;

export const FUNCTION_TAGS = [
  "Vocal",
  "Instrumental",
  "Warm-up",
  "Driving",
  "Peak",
  "Afterhours",
] as const;

/** The arc a set moves through. Order matters — it's the shape of a night. */
export const SET_ARC = ["Warm-up", "Driving", "Peak", "Afterhours"] as const;
export type SetPhase = (typeof SET_ARC)[number];

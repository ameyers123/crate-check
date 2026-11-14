/**
 * A DJ library track: what the analyzer measures, and what the tagger derives.
 *
 * `Features` are raw outputs — numbers and flat facts with no opinion. `Tags`
 * are the vocabulary a DJ actually searches by. Keeping them apart is what
 * makes the tagging explainable: every tag can point back at the numbers and
 * the threshold that produced it.
 */

/** How long you get before the next track has to be beatmatched in. */
export type IntroType = "beatless" | "long mixable" | "short" | "cold open";
export type OutroType = "clean" | "fade";

/** How likely the floor is to recognise it. Drives every floor-saving decision. */
export type Familiarity = "anthem" | "known" | "deep cut";

export type VocalDetail = "none" | "male" | "female" | "spoken" | "chopped";

/** Whether two records will lock together rhythmically. */
export type RhythmFeel = "four-on-the-floor" | "broken" | "swung" | "halftime";

export interface Features {
  bpm: number;
  /** Camelot notation, e.g. "8A". Illustrative in the demo catalog. */
  key: string;
  durationS: number;
  danceability: number;
  vocal: number;
  genre: Record<string, number>;
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
  // --- fields that describe how a record behaves in a mix ---
  intro: IntroType;
  outro: OutroType;
  familiarity: Familiarity;
  vocalDetail: VocalDetail;
  rhythm: RhythmFeel;
  /** Does it have a breakdown you can ride, or is it a flat groove? */
  hasBreakdown: boolean;
}

export interface Track {
  id: string;
  artist: string;
  title: string;
  features: Features;
  /** Set on deliberately-broken incoming files; drives the Check stage. */
  defect?: {
    kind: "set_rip" | "clip" | "wrong_edit_length" | "duplicate_mismatch";
    claims: string;
  };
}

export interface Tag {
  name: string;
  group: "genre" | "vibe" | "function" | "role";
  trace: string;
}

export interface TaggedTrack extends Track {
  tags: Tag[];
  /** 1-10. The field DJs reach for before any other. */
  energy: number;
  energyTrace: string;
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
  "Hip-Hop / Rap",
  "Pop / Open Format",
  "Drum & Bass",
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

/**
 * The back-pocket categories. These are what you reach for when the floor is
 * going wrong, and they're the reason the other tags are worth having.
 */
export const ROLE_TAGS = ["Floor Saver", "Reset", "Bridge / Tool", "Safe Drop"] as const;

export const SET_ARC = ["Warm-up", "Driving", "Peak", "Afterhours"] as const;
export type SetPhase = (typeof SET_ARC)[number];

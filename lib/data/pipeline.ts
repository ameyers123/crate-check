/**
 * The real pipeline, as aggregates.
 *
 * These numbers come from an actual run: building a DJ crate for a 2026 desert
 * event. Track-level titles shown anywhere in this project are generated (see
 * generate-catalog.ts), but every count, source name, priority tier and
 * outcome below is real.
 */

export interface Source {
  name: string;
  /** How it's found, in plain terms. */
  kind: "saved" | "chart" | "curated" | "radio";
  tracks: number;
  blurb: string;
}

/**
 * Nine places music came from. Counts sum to more than the 491 candidates
 * because a track can show up in several — and showing up twice is itself a
 * signal, which is what the top priority tier is built on.
 */
export const SOURCES: Source[] = [
  { name: "liked", kind: "saved", tracks: 116, blurb: "Everything I saved, going back years" },
  { name: "beatport_top_100_indie_dance", kind: "chart", tracks: 96, blurb: "What the genre chart says is big right now" },
  { name: "indie_dance_2026_top_100", kind: "chart", tracks: 84, blurb: "This year's indie dance rundown" },
  { name: "la_french_touch", kind: "curated", tracks: 53, blurb: "French house lineage — filtered disco, Daft-adjacent" },
  { name: "damian_lazarus_radio", kind: "radio", tracks: 48, blurb: "Artist radio: desert-sunrise melodic house" },
  { name: "jamie_xx_radio", kind: "radio", tracks: 47, blurb: "Artist radio: UK dance, broad and percussive" },
  { name: "tinzo_jojo_groovy_sunset", kind: "curated", tracks: 35, blurb: "Golden-hour groove, lower BPM" },
  { name: "i_love_whatever_this_is", kind: "curated", tracks: 22, blurb: "Genre-agnostic oddities worth a listen" },
  { name: "chitiweiner_groovers", kind: "curated", tracks: 1, blurb: "A friend's crate, one survivor" },
];

export interface PriorityBand {
  id: string;
  label: string;
  tracks: number;
  rationale: string;
}

/**
 * The triage rubric. Two axes: how recent the track is, and how much
 * independent evidence says it belongs. Recency matters because a set that
 * sounds like last year reads as stale; corroboration matters because one
 * algorithmic playlist is a guess and two agreeing is a signal.
 */
export const PRIORITY_BANDS: PriorityBand[] = [
  { id: "P0", label: "2026 release, corroborated across sources", tracks: 5, rationale: "New and independently confirmed. Near-automatic inclusion." },
  { id: "P1", label: "2026 release, on a dance playlist", tracks: 247, rationale: "The backbone of the set. Current, and vetted by at least one source I trust." },
  { id: "P2", label: "2026 release, personally saved", tracks: 25, rationale: "New and I already reacted to it. High confidence, low volume." },
  { id: "P4", label: "Curated playlist, 2020 or later", tracks: 104, rationale: "Not new, but proven on a floor. The reliable middle." },
  { id: "P5", label: "Curated playlist, back catalogue", tracks: 23, rationale: "Older cuts kept for specific moments — openers, comedowns." },
  { id: "P6", label: "Recently saved (2025-26)", tracks: 85, rationale: "My own recent taste, not yet corroborated by anything else." },
  { id: "P7", label: "Incidental playlist appearance", tracks: 2, rationale: "Weakest signal. Acquired only because it was cheap to." },
];

/** Where the funnel narrows, stage by stage. */
export const FUNNEL = [
  { stage: "Candidates seen across 9 sources", count: 1200, note: "approximate — before dedupe" },
  { stage: "Unique tracks after reconciliation", count: 491, note: "already-owned tracks removed" },
  { stage: "Files successfully acquired", count: 485, note: "6 never found anywhere" },
  { stage: "Files that survived verification", count: 470, note: "wrong recordings rejected" },
] as const;

export const OUTCOMES = {
  targeted: 491,
  playable: 470,
  /** Files that arrived with correct tags but the wrong audio inside. */
  wrongRecordingCaught: 108,
  /** Couldn't be sourced from anywhere. */
  neverFound: 6,
  /** Held back for a human listen rather than auto-rejected. */
  heldForReviewPct: 7,
} as const;

/** What the finished crate is made of. */
export const CRATE = {
  byEra: [
    { era: "2026", tracks: 107 },
    { era: "2025", tracks: 103 },
    { era: "2024", tracks: 60 },
    { era: "2020–2023", tracks: 102 },
    { era: "pre-2020", tracks: 119 },
  ],
  byVersion: [
    { version: "Original", tracks: 372, note: "the released cut" },
    { version: "Remix", tracks: 88, note: "a named third-party rework" },
    { version: "Edit / Extended", tracks: 31, note: "radio edits and long intros for mixing" },
  ],
  shortest: "2:10",
  median: "4:13",
  longest: "11:25",
  /** Tracks sharing a title with a different recording of the same name. */
  titleCollisions: 28,
} as const;

/**
 * The acquisition throughput story, in three moves.
 *
 * The lesson is about the shape of a constraint: this looked like a volume
 * problem and was actually a rate problem, so waiting longer never helped.
 */
export const THROUGHPUT = [
  { attempt: "One large batch", recovered: 172, of: 464, insight: "63% failed. The source throttled sustained traffic." },
  { attempt: "Retry the failures, twice", recovered: 0, of: 292, insight: "Zero recovered — including after a four-hour wait. Patience was the wrong lever." },
  { attempt: "Small paced waves", recovered: 193, of: 292, insight: "66% recovered. The limit was request rate, not total volume." },
] as const;

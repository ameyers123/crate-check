/**
 * Core types for the crate-check validation engine.
 *
 * The central idea: a `CatalogTrack` is what you *expected* to get (from an
 * authoritative catalog), a `Candidate` is what a source actually handed you.
 * Validation compares the two using only signals the source cannot author.
 */

/** How the catalog describes this track's version. */
export type VersionClass =
  /** The plain, unremixed release. `versionText` is empty. */
  | "original"
  /** A third-party remix. `versionText` names the remixer, e.g. "Rylo Remix". */
  | "distinct_remix"
  /** A length/format variant, e.g. "Radio Edit", "Extended Mix". */
  | "edit_or_extended";

/** An entry in the authoritative catalog — the thing you meant to acquire. */
export interface CatalogTrack {
  id: string;
  isrc: string;
  artist: string;
  /** Full title including any version suffix, e.g. "Night Drive - Rylo Remix". */
  title: string;
  /** Title with the version suffix removed, e.g. "Night Drive". */
  baseTitle: string;
  /** The version descriptor, e.g. "Rylo Remix" or "Radio Edit". Empty for originals. */
  versionText: string;
  versionClass: VersionClass;
  /** Authoritative duration in seconds. */
  expectedDurationS: number;
}

/** What a source adapter returned for a catalog track. */
export interface Candidate {
  /** Opaque provenance id from the source. */
  sourceId: string;
  /**
   * The title as published by the source. May be empty — provenance lookups
   * fail, and "we couldn't check" is a distinct outcome from "it's wrong".
   */
  title: string;
  uploader?: string;
  /** Duration the source *claims*. Advisory only. */
  durationS: number | null;
  /**
   * Duration measured from the delivered artifact itself (e.g. by ffprobe).
   * This is the load-bearing signal: the source cannot author it.
   */
  measuredDurationS: number | null;
}

export type VerdictStatus = "PASS" | "REVIEW" | "FAIL";

export type VerdictCode =
  | "OK"
  | "MISSING"
  | "FAIL_DURATION"
  | "FAIL_VERSION"
  | "REVIEW_UNCONFIRMED"
  | "REVIEW_NO_PROVENANCE";

export interface Verdict {
  status: VerdictStatus;
  code: VerdictCode;
  /** Human-readable justifications, in the order the rules fired. */
  reasons: string[];
}

/**
 * Which rules are active and how strict they are.
 *
 * `originalMixSynonym` and `nearExactDowngrade` exist as switches because both
 * were added in response to observed false positives. Turning them off in the
 * playground reproduces those false positives on demand.
 */
export interface RuleConfig {
  /** Half-width of the accepted duration window, in seconds. */
  toleranceS: number;
  durationGate: boolean;
  disqualifyingTokens: boolean;
  versionRules: boolean;
  /** Treat "Original Mix" / "Original Version" as a synonym for `original`. */
  originalMixSynonym: boolean;
  /** Downgrade an unconfirmed remix from FAIL to REVIEW when duration is near-exact. */
  nearExactDowngrade: boolean;
  /** How close counts as "near-exact", in seconds. */
  nearExactWindowS: number;
  /** Fuzzy score (0-100) at or above which an unnamed remixer earns REVIEW. */
  fuzzyReviewThreshold: number;
}

export const DEFAULT_RULES: RuleConfig = {
  toleranceS: 8,
  durationGate: true,
  disqualifyingTokens: true,
  versionRules: true,
  originalMixSynonym: true,
  nearExactDowngrade: true,
  nearExactWindowS: 5,
  fuzzyReviewThreshold: 75,
};

/** A catalog track paired with whatever the source returned for it. */
export interface Pairing {
  track: CatalogTrack;
  candidate: Candidate | null;
}

export interface ValidatedPairing extends Pairing {
  verdict: Verdict;
}

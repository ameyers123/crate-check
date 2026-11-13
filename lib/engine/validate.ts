/**
 * The validation engine.
 *
 * Premise: the system that fetches a file usually also writes that file's
 * metadata. So checking metadata against the catalog is circular — it proves
 * the fetcher was internally consistent, not that the audio is right. This
 * engine only uses signals the fetcher cannot author:
 *
 *   1. the measured duration of the delivered artifact
 *   2. the title the *source* published, independent of the fetcher
 *
 * It returns three outcomes, not two. "We could not confirm this" is a
 * different state from "this is contradicted", and collapsing them either
 * floods the library with unchecked files or buries good files in a reject
 * pile nobody reads.
 */

import {
  DISQUALIFYING_TOKENS,
  GENERIC_VERSION_TOKENS,
  ORIGINAL_SYNONYM_PATTERN,
  REMIX_SUFFIX_PATTERN,
} from "./vocab";
import { partialRatio } from "./similarity";
import type {
  Candidate,
  CatalogTrack,
  Pairing,
  RuleConfig,
  ValidatedPairing,
  Verdict,
} from "./types";
import { DEFAULT_RULES } from "./types";

/** Strip trailing "Remix"/"Rmx" to recover the remixer's name. */
export function remixerName(versionText: string): string {
  return versionText.replace(REMIX_SUFFIX_PATTERN, "").trim();
}

/** The accepted duration window for a track, given a tolerance. */
export function durationWindow(
  track: CatalogTrack,
  toleranceS: number,
): [number, number] {
  return [track.expectedDurationS - toleranceS, track.expectedDurationS + toleranceS];
}

function fail(code: Verdict["code"], reason: string): Verdict {
  return { status: "FAIL", code, reasons: [reason] };
}
function review(code: Verdict["code"], reason: string): Verdict {
  return { status: "REVIEW", code, reasons: [reason] };
}
function pass(reason: string): Verdict {
  return { status: "PASS", code: "OK", reasons: [reason] };
}

/**
 * Check the source's published title against the version the catalog wants.
 *
 * Only ever consulted once the duration gate has already passed.
 */
export function checkVersion(
  track: CatalogTrack,
  candidate: Candidate,
  config: RuleConfig,
): Verdict {
  const catalogTitle = track.title.toLowerCase();
  const sourceTitle = candidate.title.toLowerCase();
  const versionText = track.versionText.trim();

  // No provenance title at all. Not a failure — just unverifiable. For a plain
  // original the duration match already carries the weight; for a specific
  // version we genuinely cannot tell, so a human should glance at it.
  if (!sourceTitle) {
    return track.versionClass === "original"
      ? pass("no source title available; original expected, duration is sufficient")
      : review(
          "REVIEW_NO_PROVENANCE",
          "no source title available to confirm the expected version",
        );
  }

  // Categorically-wrong content. Checked first: a live cut is wrong no matter
  // what the catalog's version class says.
  if (config.disqualifyingTokens) {
    const hits = DISQUALIFYING_TOKENS.filter(
      (t) => sourceTitle.includes(t) && !catalogTitle.includes(t),
    );
    if (hits.length > 0) {
      return fail(
        "FAIL_VERSION",
        `source title carries disqualifying token(s) absent from the catalog: ${hits.join(", ")}`,
      );
    }
  }

  if (!config.versionRules) {
    return pass("version rules disabled");
  }

  if (track.versionClass === "distinct_remix") {
    const remixer = remixerName(versionText);
    if (remixer && sourceTitle.includes(remixer.toLowerCase())) {
      return pass(`remixer "${remixer}" confirmed in source title`);
    }
    const score = remixer ? partialRatio(remixer.toLowerCase(), sourceTitle) : 0;
    if (score >= config.fuzzyReviewThreshold) {
      return review(
        "REVIEW_UNCONFIRMED",
        `remixer "${remixer}" not verbatim in source title (fuzzy ${score})`,
      );
    }
    // Not confirmed — but nothing contradicted it either. An official upload
    // routinely omits the remix credit from its title, and a near-exact runtime
    // is real corroborating evidence. Absence of proof is not disproof.
    if (
      config.nearExactDowngrade &&
      candidate.measuredDurationS !== null &&
      Math.abs(candidate.measuredDurationS - track.expectedDurationS) <=
        config.nearExactWindowS
    ) {
      return review(
        "REVIEW_UNCONFIRMED",
        `remixer "${remixer}" absent from source title, but duration matches almost exactly ` +
          `(${candidate.measuredDurationS.toFixed(1)}s vs ${track.expectedDurationS}s)`,
      );
    }
    return fail("FAIL_VERSION", `remixer "${remixer}" not found in source title`);
  }

  if (track.versionClass === "edit_or_extended") {
    if (versionText && sourceTitle.includes(versionText.toLowerCase())) {
      return pass(`expected version "${versionText}" confirmed in source title`);
    }
    const conflicting = GENERIC_VERSION_TOKENS.filter(
      (t) =>
        sourceTitle.includes(t) &&
        !versionText.toLowerCase().includes(t) &&
        !catalogTitle.includes(t),
    );
    if (conflicting.length > 0) {
      return fail(
        "FAIL_VERSION",
        `source title announces a different version (${conflicting.join(", ")}), expected "${versionText}"`,
      );
    }
    return review(
      "REVIEW_UNCONFIRMED",
      `expected version "${versionText}" not confirmable from source title`,
    );
  }

  // versionClass === "original"
  // "Original Mix" is dance-music convention for the unremixed release, i.e. a
  // synonym for what we want — not a competing version. Strip those phrases
  // before scanning, or every correctly-matched original trips the "mix" token.
  const scanned = config.originalMixSynonym
    ? sourceTitle.replace(ORIGINAL_SYNONYM_PATTERN, "")
    : sourceTitle;
  const conflicting = GENERIC_VERSION_TOKENS.filter(
    (t) => scanned.includes(t) && !catalogTitle.includes(t),
  );
  if (conflicting.length > 0) {
    return fail(
      "FAIL_VERSION",
      `original expected but source title announces a version (${conflicting.join(", ")})`,
    );
  }
  return pass("no conflicting version markers in source title");
}

/** Validate a single catalog track against what the source returned. */
export function validateTrack(
  track: CatalogTrack,
  candidate: Candidate | null,
  config: RuleConfig = DEFAULT_RULES,
): Verdict {
  if (!candidate) {
    return {
      status: "FAIL",
      code: "MISSING",
      reasons: ["no candidate was returned for this track"],
    };
  }

  // Duration gate first. It is the only check the source cannot talk its way
  // out of, and it is what catches a correctly-titled 7-minute DJ-set rip
  // standing in for a 3-minute single.
  if (config.durationGate) {
    const measured = candidate.measuredDurationS;
    if (measured === null) {
      return fail("FAIL_DURATION", "artifact duration could not be measured");
    }
    const [lo, hi] = durationWindow(track, config.toleranceS);
    if (measured < lo || measured > hi) {
      const delta = measured / track.expectedDurationS;
      return fail(
        "FAIL_DURATION",
        `measured ${measured.toFixed(1)}s outside [${lo}, ${hi}]s ` +
          `(${delta.toFixed(2)}x expected ${track.expectedDurationS}s)`,
      );
    }
  }

  const verdict = checkVersion(track, candidate, config);

  // Secondary signal: the source's *claimed* runtime disagreeing with the
  // window while the measured file agrees is odd enough to flag, not to reject.
  if (
    verdict.status === "PASS" &&
    candidate.durationS !== null &&
    config.durationGate
  ) {
    const [lo, hi] = durationWindow(track, config.toleranceS);
    if (candidate.durationS < lo - 3 || candidate.durationS > hi + 3) {
      return {
        status: "REVIEW",
        code: "REVIEW_UNCONFIRMED",
        reasons: [
          ...verdict.reasons,
          `source-reported duration ${candidate.durationS}s falls outside the window though the file itself matches`,
        ],
      };
    }
  }

  return verdict;
}

/** Validate a whole batch. */
export function validateAll(
  pairings: Pairing[],
  config: RuleConfig = DEFAULT_RULES,
): ValidatedPairing[] {
  return pairings.map((p) => ({
    ...p,
    verdict: validateTrack(p.track, p.candidate, config),
  }));
}

export interface Tally {
  PASS: number;
  REVIEW: number;
  FAIL: number;
  total: number;
}

export function tally(results: ValidatedPairing[]): Tally {
  const t: Tally = { PASS: 0, REVIEW: 0, FAIL: 0, total: results.length };
  for (const r of results) t[r.verdict.status]++;
  return t;
}

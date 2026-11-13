/**
 * The ingestion boundary.
 *
 * crate-check validates; it does not acquire. Everything upstream of this
 * interface — wherever candidates actually come from — is deliberately out of
 * scope for this repository. The only implementation shipped here is a
 * deterministic mock used by the demo and the test suite.
 *
 * Keeping ingestion behind an interface is not just a licensing nicety. It is
 * what makes the engine testable: the interesting failure modes are rare in
 * the wild and trivial to construct against a mock.
 */

import type { Candidate, CatalogTrack } from "../engine/types";

export interface SourceAdapter {
  /** Human-readable name, surfaced in reports. */
  readonly name: string;

  /**
   * Return the best candidate this source has for a catalog track, or `null`
   * if it has nothing. Implementations should not attempt to self-validate —
   * returning a wrong-but-plausible candidate is expected, and catching that
   * is the engine's job.
   */
  find(track: CatalogTrack): Promise<Candidate | null>;
}

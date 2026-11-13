/**
 * The only adapter shipped in this repository.
 *
 * It replays a fixed set of pre-built candidates — including deliberately
 * wrong ones — so the demo and the test suite exercise every validation path
 * without touching the network.
 */

import type { Candidate, CatalogTrack } from "../engine/types";
import type { CatalogEntry } from "../data/generate-catalog";
import type { SourceAdapter } from "./source-adapter";

export class MockAdapter implements SourceAdapter {
  readonly name = "mock";
  private byTrackId: Map<string, Candidate | null>;

  constructor(entries: CatalogEntry[]) {
    this.byTrackId = new Map(entries.map((e) => [e.track.id, e.candidate]));
  }

  async find(track: CatalogTrack): Promise<Candidate | null> {
    return this.byTrackId.get(track.id) ?? null;
  }
}

/**
 * Engine tests.
 *
 * The false-positive cases are the point of this file. Both of them shipped
 * as bugs first, were caught by reading verdicts against real audio, and are
 * pinned here so they cannot come back.
 */

import { describe, expect, it } from "vitest";
import { DEFAULT_RULES, validateTrack, validateAll, tally } from "../lib/engine";
import type { Candidate, CatalogTrack, RuleConfig } from "../lib/engine";
import { generateCatalog } from "../lib/data/generate-catalog";

const track = (over: Partial<CatalogTrack> = {}): CatalogTrack => ({
  id: "trk_test",
  isrc: "ZZQA2600001",
  artist: "Kolm Hale",
  title: "Night Drive",
  baseTitle: "Night Drive",
  versionText: "",
  versionClass: "original",
  expectedDurationS: 200,
  ...over,
});

const cand = (over: Partial<Candidate> = {}): Candidate => ({
  sourceId: "src_test",
  title: "Kolm Hale - Night Drive",
  durationS: 200,
  measuredDurationS: 200,
  ...over,
});

const rules = (over: Partial<RuleConfig> = {}): RuleConfig => ({
  ...DEFAULT_RULES,
  ...over,
});

describe("duration gate", () => {
  it("passes a track inside the window", () => {
    expect(validateTrack(track(), cand({ measuredDurationS: 204 })).status).toBe("PASS");
  });

  it("fails a DJ-set rip even though the title is correct", () => {
    const v = validateTrack(track(), cand({ measuredDurationS: 420, durationS: 420 }));
    expect(v.status).toBe("FAIL");
    expect(v.code).toBe("FAIL_DURATION");
    expect(v.reasons[0]).toContain("2.10x");
  });

  it("fails a truncated snippet", () => {
    const v = validateTrack(track(), cand({ measuredDurationS: 120, durationS: 120 }));
    expect(v.code).toBe("FAIL_DURATION");
  });

  it("fails when the artifact cannot be measured at all", () => {
    expect(validateTrack(track(), cand({ measuredDurationS: null })).code).toBe(
      "FAIL_DURATION",
    );
  });

  it("widening tolerance admits a borderline file", () => {
    const c = cand({ measuredDurationS: 214, durationS: 214 });
    expect(validateTrack(track(), c).status).toBe("FAIL");
    expect(validateTrack(track(), c, rules({ toleranceS: 20 })).status).toBe("PASS");
  });
});

describe("disqualifying tokens", () => {
  it("fails a live cut that matches on runtime", () => {
    const v = validateTrack(
      track(),
      cand({ title: "Kolm Hale - Night Drive (Live at Hale Street)" }),
    );
    expect(v.status).toBe("FAIL");
    expect(v.reasons[0]).toContain("live");
  });

  it("fails an acapella", () => {
    const v = validateTrack(
      track(),
      cand({ title: "Kolm Hale - Night Drive (Acappella)", measuredDurationS: 203 }),
    );
    expect(v.code).toBe("FAIL_VERSION");
  });

  it("allows a token the catalog itself asks for", () => {
    const t = track({ title: "Night Drive (Live)", baseTitle: "Night Drive" });
    const v = validateTrack(t, cand({ title: "Kolm Hale - Night Drive (Live)" }));
    expect(v.status).toBe("PASS");
  });
});

describe('false positive #1 — "Original Mix" is a synonym, not a conflict', () => {
  const c = cand({ title: "Kolm Hale - Night Drive (Original Mix)" });

  it("passes with the synonym rule on", () => {
    expect(validateTrack(track(), c).status).toBe("PASS");
  });

  it("regresses to a false FAIL with the rule off", () => {
    const v = validateTrack(track(), c, rules({ originalMixSynonym: false }));
    expect(v.status).toBe("FAIL");
    expect(v.reasons[0]).toContain("original mix");
  });

  it("still fails a genuinely different version", () => {
    const v = validateTrack(
      track(),
      cand({ title: "Kolm Hale - Night Drive (Extended Mix)", measuredDurationS: 203 }),
    );
    expect(v.code).toBe("FAIL_VERSION");
  });
});

describe("false positive #2 — unconfirmed is not contradicted", () => {
  const remixTrack = track({
    title: "Night Drive - Rylo Remix",
    versionText: "Rylo Remix",
    versionClass: "distinct_remix",
  });
  // Official upload, right runtime to the second, no remix credit in the title.
  const c = cand({ title: "Kolm Hale - Night Drive", measuredDurationS: 201 });

  it("downgrades to REVIEW when the runtime is near-exact", () => {
    const v = validateTrack(remixTrack, c);
    expect(v.status).toBe("REVIEW");
    expect(v.reasons[0]).toContain("almost exactly");
  });

  it("hardens to FAIL with the downgrade disabled", () => {
    expect(validateTrack(remixTrack, c, rules({ nearExactDowngrade: false })).status).toBe(
      "FAIL",
    );
  });

  it("still fails when the runtime is merely inside the window, not near-exact", () => {
    const v = validateTrack(remixTrack, cand({ title: "Kolm Hale - Night Drive", measuredDurationS: 207 }));
    expect(v.status).toBe("FAIL");
  });

  it("passes outright when the remixer is named", () => {
    const v = validateTrack(
      remixTrack,
      cand({ title: "Kolm Hale - Night Drive (Rylo Remix)" }),
    );
    expect(v.status).toBe("PASS");
  });

  it("reviews a near-miss spelling of the remixer", () => {
    const v = validateTrack(
      remixTrack,
      cand({ title: "Kolm Hale - Night Drive (RylE Rmx)" }),
    );
    expect(v.status).toBe("REVIEW");
  });
});

describe("missing provenance", () => {
  it("passes an original on duration alone", () => {
    expect(validateTrack(track(), cand({ title: "", durationS: null })).status).toBe("PASS");
  });

  it("reviews a specific version it cannot corroborate", () => {
    const t = track({
      title: "Night Drive - Extended Mix",
      versionText: "Extended Mix",
      versionClass: "edit_or_extended",
    });
    const v = validateTrack(t, cand({ title: "", durationS: null }));
    expect(v.status).toBe("REVIEW");
    expect(v.code).toBe("REVIEW_NO_PROVENANCE");
  });
});

describe("edit_or_extended", () => {
  const t = track({
    title: "Night Drive - Radio Edit",
    versionText: "Radio Edit",
    versionClass: "edit_or_extended",
  });

  it("passes when the expected version is named", () => {
    expect(
      validateTrack(t, cand({ title: "Kolm Hale - Night Drive (Radio Edit)" })).status,
    ).toBe("PASS");
  });

  it("fails when a competing version is named", () => {
    expect(
      validateTrack(t, cand({ title: "Kolm Hale - Night Drive (Club Mix)" })).code,
    ).toBe("FAIL_VERSION");
  });

  it("reviews a title that is simply silent", () => {
    expect(validateTrack(t, cand({ title: "Kolm Hale - Night Drive" })).status).toBe(
      "REVIEW",
    );
  });
});

describe("missing candidate", () => {
  it("is a FAIL with code MISSING", () => {
    const v = validateTrack(track(), null);
    expect(v.status).toBe("FAIL");
    expect(v.code).toBe("MISSING");
  });
});

describe("catalog-level behaviour", () => {
  const entries = generateCatalog();
  const pairings = entries.map((e) => ({ track: e.track, candidate: e.candidate }));

  it("is deterministic", () => {
    expect(generateCatalog()[42]).toEqual(entries[42]);
  });

  it("every clean entry passes", () => {
    for (const e of entries.filter((x) => x.scenario === "clean")) {
      expect(validateTrack(e.track, e.candidate).status, e.track.title).toBe("PASS");
    }
  });

  it("every DJ-set rip and snippet is caught", () => {
    for (const e of entries.filter(
      (x) => x.scenario === "dj_set_rip" || x.scenario === "snippet",
    )) {
      expect(validateTrack(e.track, e.candidate).code, e.track.title).toBe("FAIL_DURATION");
    }
  });

  it("every Original Mix label passes", () => {
    for (const e of entries.filter((x) => x.scenario === "original_mix_label")) {
      expect(validateTrack(e.track, e.candidate).status, e.track.title).toBe("PASS");
    }
  });

  it("loosening the gate to absurdity still catches version errors", () => {
    const loose = rules({ toleranceS: 600 });
    const live = entries.filter((e) => e.scenario === "live_cut");
    for (const e of live) {
      expect(validateTrack(e.track, e.candidate, loose).code).toBe("FAIL_VERSION");
    }
  });

  it("tallies to the catalog size", () => {
    const t = tally(validateAll(pairings));
    expect(t.PASS + t.REVIEW + t.FAIL).toBe(entries.length);
  });
});

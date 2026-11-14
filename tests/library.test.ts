import { describe, expect, it } from "vitest";
import { generateLibrary } from "../lib/library/generate";
import { computeThresholds, tagTrack, tagLibrary, hasTag } from "../lib/library/tagger";
import { auditLibrary } from "../lib/library/audit";
import type { Features, Track } from "../lib/library/types";

const library = generateLibrary();
const thresholds = computeThresholds(library);

const features = (over: Partial<Features> = {}): Features => ({
  bpm: 126,
  key: "8A",
  durationS: 330,
  danceability: 0.9,
  vocal: 0.2,
  genre: { House: 0.5, "Deep House": 0.2, Techno: 0.1, "Tech House": 0.15 },
  mood: {
    party: 0.5, happy: 0.5, relaxed: 0.4, aggressive: 0.3, dark: 0.3,
    emotional: 0.3, groovy: 0.4, uplifting: 0.4, positive: 0.5, approachability: 0.5,
    ...over.mood,
  },
  ...over,
});

const track = (f: Partial<Features> = {}): Track => ({
  id: "test",
  artist: "Test Artist",
  title: "Test Track",
  features: features(f),
});

describe("tagger", () => {
  it("gives every track exactly one of Vocal or Instrumental", () => {
    const { tracks } = tagLibrary(library);
    for (const t of tracks) {
      const n = t.tags.filter((x) => x.name === "Vocal" || x.name === "Instrumental").length;
      expect(n, t.title).toBe(1);
    }
  });

  it("records a reason for every tag", () => {
    const { tracks } = tagLibrary(library);
    for (const t of tracks) {
      for (const tag of t.tags) {
        expect(tag.trace.length, `${t.title} / ${tag.name}`).toBeGreaterThan(0);
      }
    }
  });

  it("suppresses the umbrella House tag when a subfamily already fired", () => {
    const t = tagTrack(
      track({ genre: { House: 0.9, "Deep House": 0.9, Techno: 0.05, "Tech House": 0.05 } }),
      thresholds,
    );
    expect(hasTag(t, "Deep House")).toBe(true);
    expect(hasTag(t, "House")).toBe(false);
  });

  it("keeps House when no subfamily fired", () => {
    const t = tagTrack(
      track({ genre: { House: 0.95, "Deep House": 0.02, Techno: 0.02, "Tech House": 0.02 } }),
      thresholds,
    );
    expect(hasTag(t, "House")).toBe(true);
  });

  it("allows a track to carry several genres at once", () => {
    const { tracks } = tagLibrary(library);
    expect(tracks.some((t) => t.tags.filter((x) => x.group === "genre").length > 1)).toBe(true);
  });

  it("thresholds are relative: the same track tags differently in a different library", () => {
    const darkLibrary = library.map((t) => ({
      ...t,
      features: { ...t.features, mood: { ...t.features.mood, dark: 0.95 } },
    }));
    const subject = track({ mood: { ...features().mood, dark: 0.8 } });
    const inNormal = tagTrack(subject, thresholds);
    const inDark = tagTrack(subject, computeThresholds(darkLibrary));
    expect(hasTag(inNormal, "Dark")).toBe(true);
    // Against a library where everything is darker, 0.8 is no longer remarkable.
    expect(hasTag(inDark, "Dark")).toBe(false);
  });

  it("tags a slow, calm, unaggressive track as Warm-up", () => {
    const t = tagTrack(
      track({ bpm: 112, mood: { ...features().mood, relaxed: 0.95, aggressive: 0.02, party: 0.05 } }),
      thresholds,
    );
    expect(hasTag(t, "Warm-up")).toBe(true);
    expect(hasTag(t, "Peak")).toBe(false);
  });

  it("tags a fast, danceable, party track as Peak", () => {
    const t = tagTrack(
      track({ bpm: 132, danceability: 0.99, mood: { ...features().mood, party: 0.98, aggressive: 0.7 } }),
      thresholds,
    );
    expect(hasTag(t, "Peak")).toBe(true);
    expect(hasTag(t, "Warm-up")).toBe(false);
  });

  it("produces a usable spread across the set arc", () => {
    const { tracks } = tagLibrary(library);
    for (const phase of ["Warm-up", "Driving", "Peak", "Afterhours"]) {
      expect(tracks.filter((t) => hasTag(t, phase)).length, phase).toBeGreaterThan(0);
    }
  });

  it("is deterministic", () => {
    expect(generateLibrary()[30]).toEqual(library[30]);
  });
});

describe("audit", () => {
  const audit = (t: Track) => auditLibrary([t]);

  it("flags a long file with no mix marker as a set rip", () => {
    const issues = audit({ ...track(), title: "Night Drive", features: features({ durationS: 2800 }) });
    expect(issues[0]?.kind).toBe("set_rip");
  });

  it("leaves a long file alone when the title says it is a mix", () => {
    const issues = audit({
      ...track(),
      title: "Night Drive (DJ Mix)",
      features: features({ durationS: 2800 }),
    });
    expect(issues).toHaveLength(0);
  });

  it("flags a truncated clip", () => {
    expect(audit({ ...track(), features: features({ durationS: 55 }) })[0]?.kind).toBe("clip");
  });

  it("flags a Radio Edit that runs far too long", () => {
    const issues = audit({
      ...track(),
      title: "Night Drive - Radio Edit",
      features: features({ durationS: 540 }),
    });
    expect(issues[0]?.kind).toBe("radio_edit_too_long");
  });

  it("flags an Extended Mix that is shorter than a single", () => {
    const issues = audit({
      ...track(),
      title: "Night Drive - Extended Mix",
      features: features({ durationS: 170 }),
    });
    expect(issues[0]?.kind).toBe("extended_too_short");
  });

  it("passes an ordinary track", () => {
    expect(audit(track())).toHaveLength(0);
  });

  it("flags two copies of one record with very different lengths", () => {
    const a = { ...track(), id: "a" };
    const b = { ...track(), id: "b", features: features({ durationS: 900 }) };
    const kinds = auditLibrary([a, b]).map((i) => i.kind);
    expect(kinds).toContain("duplicate_mismatch");
  });

  it("does not flag duplicates that are merely a few seconds apart", () => {
    const a = { ...track(), id: "a" };
    const b = { ...track(), id: "b", features: features({ durationS: 336 }) };
    expect(auditLibrary([a, b])).toHaveLength(0);
  });

  it("finds every planted defect in the sample library", () => {
    const planted = library.filter((t) => t.defect).map((t) => t.id);
    const flagged = new Set(auditLibrary(library).map((i) => i.track.id));
    for (const id of planted) expect(flagged.has(id), id).toBe(true);
  });
});

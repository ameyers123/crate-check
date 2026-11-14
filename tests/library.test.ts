import { describe, expect, it } from "vitest";
import { generateLibrary } from "../lib/library/generate";
import { computeThresholds, tagTrack, tagLibrary, hasTag } from "../lib/library/tagger";
import { auditLibrary } from "../lib/library/audit";
import { analyzeAudio, estimateTempo, fft } from "../lib/library/analyze-audio";
import type { Features, Track } from "../lib/library/types";
import { REFERENCE_THRESHOLDS, REFERENCE_CORPUS_SIZE } from "../lib/library/reference";

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
  intro: "long mixable",
  outro: "clean",
  familiarity: "known",
  vocalDetail: "none",
  rhythm: "four-on-the-floor",
  hasBreakdown: true,
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

/* ------------------------------------------------- the real demo catalog -- */

import { buildCatalog } from "../lib/library/build-catalog";
import { CATALOG } from "../lib/library/catalog";
import {
  compatibleKeys, keyDistance, parseCamelot, whatFitsNext, emergencyOptions,
} from "../lib/library/mixing";
import { SET_SHAPES, planSet } from "../lib/library/setshapes";

const catalog = buildCatalog();
const tagged = tagLibrary(catalog).tracks;

describe("catalog", () => {
  it("carries the measured BPM through untouched", () => {
    for (const [i, row] of CATALOG.entries()) {
      expect(catalog[i].features.bpm, row.title).toBe(row.bpm);
    }
  });

  it("re-derives the genre tags the real analysis produced", () => {
    for (const [i, row] of CATALOG.entries()) {
      for (const g of row.genre) {
        expect(hasTag(tagged[i], g), `${row.title} / ${g}`).toBe(true);
      }
    }
  });

  it("re-derives most vibe tags, and never inverts the ordering", () => {
    // Not all of them, and that is the design rather than a defect. Thresholds
    // are percentiles of the library in front of them. This 43-track catalog
    // deliberately over-samples relaxed/hypnotic material, so a p75 bar cannot
    // admit all ~40% of tracks the full 3,000-track library flagged Relaxed.
    // What must hold is the ordering: a flagged track always scores higher on
    // that mood than an unflagged one.
    let hits = 0;
    let total = 0;
    for (const [i, row] of CATALOG.entries()) {
      for (const v of row.vibe) {
        total++;
        if (hasTag(tagged[i], v)) hits++;
      }
    }
    expect(hits / total).toBeGreaterThan(0.6);

    const moodKey = { Party: "party", Relaxed: "relaxed", Happy: "happy", Dark: "dark" } as const;
    for (const [label, key] of Object.entries(moodKey)) {
      const flagged = CATALOG.map((r, i) => [r, tagged[i]] as const).filter(([r]) =>
        r.vibe.includes(label),
      );
      const unflagged = CATALOG.map((r, i) => [r, tagged[i]] as const).filter(
        ([r]) => !r.vibe.includes(label),
      );
      if (!flagged.length || !unflagged.length) continue;
      const lo = Math.min(...flagged.map(([, t]) => t.features.mood[key]));
      const hi = Math.max(...unflagged.map(([, t]) => t.features.mood[key]));
      expect(lo, label).toBeGreaterThan(hi);
    }
  });

  it("does not fire a character tag on the whole library", () => {
    // Percentile thresholds collapse if every track shares a default value.
    for (const name of ["Dark", "Emotional", "Groovy", "Aggressive", "Euphoric"]) {
      const n = tagged.filter((t) => hasTag(t, name)).length;
      expect(n, name).toBeGreaterThan(0);
      expect(n, name).toBeLessThan(tagged.length * 0.4);
    }
  });

  it("spreads energy across the range", () => {
    const e = tagged.map((t) => t.energy);
    expect(Math.min(...e)).toBeLessThanOrEqual(4);
    expect(Math.max(...e)).toBeGreaterThanOrEqual(9);
  });

  it("populates every role tag", () => {
    for (const r of ["Floor Saver", "Reset", "Bridge / Tool", "Safe Drop"]) {
      expect(tagged.filter((t) => hasTag(t, r)).length, r).toBeGreaterThan(0);
    }
  });
});

describe("camelot", () => {
  it("parses valid keys and rejects junk", () => {
    expect(parseCamelot("8A")).toEqual({ n: 8, letter: "A" });
    expect(parseCamelot("12B")).toEqual({ n: 12, letter: "B" });
    expect(parseCamelot("13A")).toBeNull();
    expect(parseCamelot("banana")).toBeNull();
  });

  it("offers the same key, both neighbours, and the ring swap", () => {
    expect(new Set(compatibleKeys("8A"))).toEqual(new Set(["8A", "7A", "9A", "8B"]));
  });

  it("wraps around the wheel", () => {
    expect(new Set(compatibleKeys("1A"))).toEqual(new Set(["1A", "12A", "2A", "1B"]));
  });

  it("measures distance, treating the ring swap as one move", () => {
    expect(keyDistance("8A", "8A")).toBe(0);
    expect(keyDistance("8A", "9A")).toBe(1);
    expect(keyDistance("8A", "8B")).toBe(1);
    expect(keyDistance("8A", "2A")).toBe(6);
  });
});

describe("what fits next", () => {
  const current = tagged.find((t) => t.features.key === "8A" && t.features.bpm === 124)!;

  it("puts a key-compatible, close-tempo track on top", () => {
    const [best] = whatFitsNext(current, tagged, { limit: 1 });
    const d = keyDistance(current.features.key, best.track.features.key)!;
    expect(d).toBeLessThanOrEqual(1);
    const drift = Math.abs(best.track.features.bpm - current.features.bpm) / current.features.bpm;
    expect(drift).toBeLessThanOrEqual(0.06);
  });

  it("never suggests the track already playing", () => {
    expect(whatFitsNext(current, tagged, { limit: 20 }).some((c) => c.track.id === current.id)).toBe(false);
  });

  it("explains every suggestion on all four signals", () => {
    for (const c of whatFitsNext(current, tagged, { limit: 5 })) {
      expect(c.signals.map((s) => s.label)).toEqual(["Key", "Tempo", "Energy", "Intro"]);
      for (const s of c.signals) expect(s.detail.length).toBeGreaterThan(0);
    }
  });

  it("ranks a clashing key below a compatible one", () => {
    const all = whatFitsNext(current, tagged, { limit: 50 });
    const good = all.find((c) => c.signals[0].verdict === "good");
    const bad = all.find((c) => c.signals[0].verdict === "bad");
    if (good && bad) expect(good.score).toBeGreaterThan(bad.score);
  });

  it("returns playable options for each emergency", () => {
    for (const kind of ["floor_emptying", "key_clash", "tempo_jump"] as const) {
      expect(emergencyOptions(current, tagged, kind).length, kind).toBeGreaterThan(0);
    }
  });
});

describe("set shapes", () => {
  it("fills every shape's curve", () => {
    for (const s of SET_SHAPES) {
      expect(planSet(s, tagged).length, s.name).toBe(s.curve.length);
    }
  });

  it("never repeats a track within a set", () => {
    for (const s of SET_SHAPES) {
      const ids = planSet(s, tagged).map((p) => p.track.id);
      expect(new Set(ids).size, s.name).toBe(ids.length);
    }
  });

  it("an opening set stays below peak energy", () => {
    const plan = planSet(SET_SHAPES.find((s) => s.id === "opening")!, tagged);
    expect(Math.max(...plan.map((p) => p.track.energy))).toBeLessThanOrEqual(7);
  });

  it("a peak-time set starts high and stays there", () => {
    const plan = planSet(SET_SHAPES.find((s) => s.id === "peaktime")!, tagged);
    expect(Math.min(...plan.map((p) => p.track.energy))).toBeGreaterThanOrEqual(7);
  });

  it("a closing set ends lower than it starts", () => {
    const plan = planSet(SET_SHAPES.find((s) => s.id === "closing")!, tagged);
    expect(plan[plan.length - 1].track.energy).toBeLessThan(plan[0].track.energy);
  });

  it("a classic arc peaks in the middle, not at either end", () => {
    const e = planSet(SET_SHAPES.find((s) => s.id === "classic")!, tagged).map((p) => p.track.energy);
    const peakAt = e.indexOf(Math.max(...e));
    expect(peakAt).toBeGreaterThan(0);
    expect(peakAt).toBeLessThan(e.length - 1);
  });
});

describe("threshold stability", () => {
  // The point of freezing the cutoffs: a record's tags are a property of the
  // record, not of whatever else happens to be sitting next to it.
  const catalog = buildCatalog();
  const subject = catalog[0];

  const tagsOf = (lib: Track[], opts?: { relativeTo?: "reference" | "library" }) => {
    const { tracks } = tagLibrary(lib, opts);
    return tracks
      .find((t) => t.id === subject.id)!
      .tags.map((t) => t.name)
      .sort();
  };

  it("gives a track the same tags whatever else is in the library", () => {
    const alone = tagsOf([subject]);
    const full = tagsOf(catalog);
    const half = tagsOf(catalog.filter((_, i) => i === 0 || i % 2 === 1));
    expect(alone).toEqual(full);
    expect(half).toEqual(full);
  });

  it("still shifts under the relative reading, which is why it isn't the default", () => {
    // A one-track library has no spread, so every percentile collapses onto
    // that track's own values and the tags it gets are close to meaningless.
    const relativeAlone = tagsOf([subject], { relativeTo: "library" });
    const relativeFull = tagsOf(catalog, { relativeTo: "library" });
    expect(relativeAlone).not.toEqual(relativeFull);
  });

  it("reference cutoffs are frozen data, not recomputed from the catalog", () => {
    const fromCatalog = computeThresholds(catalog);
    expect(REFERENCE_THRESHOLDS).not.toEqual(fromCatalog);
    expect(REFERENCE_CORPUS_SIZE).toBeGreaterThan(1000);
  });
});

describe("audio analysis", () => {
  const SR = 44100;

  /** A kick-like thump every beat, which is all a tempo estimator needs. */
  const clickTrack = (bpm: number, seconds = 6) => {
    const x = new Float32Array(SR * seconds);
    const beat = 60 / bpm;
    for (let b = 0; b * beat < seconds; b++) {
      const start = Math.floor(b * beat * SR);
      for (let i = 0; i < SR * 0.12 && start + i < x.length; i++) {
        const t = i / SR;
        x[start + i] += Math.sin(2 * Math.PI * (140 * Math.exp(-t * 36) + 50) * t) * Math.exp(-t * 26);
      }
    }
    return x;
  };

  const sine = (hz: number, seconds = 6) => {
    const x = new Float32Array(SR * seconds);
    for (let i = 0; i < x.length; i++) x[i] = Math.sin((2 * Math.PI * hz * i) / SR) * 0.6;
    return x;
  };

  const noise = (seconds = 6) => {
    const x = new Float32Array(SR * seconds);
    let seed = 12345;
    for (let i = 0; i < x.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      x[i] = (seed / 0x7fffffff) * 2 - 1;
    }
    return x;
  };

  it("fft round-trips a known single-bin signal", () => {
    const n = 64;
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let i = 0; i < n; i++) re[i] = Math.cos((2 * Math.PI * 4 * i) / n);
    fft(re, im);
    const mags = Array.from({ length: n / 2 }, (_, i) => Math.hypot(re[i], im[i]));
    expect(mags.indexOf(Math.max(...mags))).toBe(4);
  });

  it("rejects an fft length that is not a power of two", () => {
    expect(() => fft(new Float64Array(10), new Float64Array(10))).toThrow(/power of two/);
  });

  it("recovers the tempo of a click track to within 1 BPM", () => {
    for (const bpm of [100, 124, 140]) {
      const est = estimateTempo(clickTrack(bpm), SR);
      expect(est.bpm, `${bpm} BPM`).not.toBeNull();
      expect(Math.abs(est.bpm! - bpm), `${bpm} BPM, got ${est.bpm}`).toBeLessThanOrEqual(1);
    }
  });

  it("reports no tempo for material with no transients", () => {
    // A steady tone autocorrelates with itself beautifully and still has no
    // beat. Reporting a number here would be worse than reporting nothing.
    expect(estimateTempo(sine(110), SR).bpm).toBeNull();
  });

  it("separates noise from music on centroid and zero crossings", () => {
    const n = analyzeAudio(noise(), SR);
    const m = analyzeAudio(clickTrack(124), SR);
    expect(n.centroid).toBeGreaterThan(m.centroid * 4);
    expect(n.zcr).toBeGreaterThan(m.zcr * 4);
    expect(n.verdict.broken).toBe(true);
    expect(m.verdict.broken).toBe(false);
  });

  it("does not call quiet or beatless music broken", () => {
    expect(analyzeAudio(sine(110), SR).verdict.broken).toBe(false);
  });

  it("a noise file of a plausible length passes every metadata check", () => {
    // The point of the audio stage: the cheap checks cannot see this at all.
    const track: Track = {
      id: "noise-1",
      artist: "Someone",
      title: "A Record (Extended Mix)",
      features: { ...features(), durationS: 395 },
    };
    expect(auditLibrary([track])).toHaveLength(0);
    expect(analyzeAudio(noise(), SR).verdict.broken).toBe(true);
  });
});

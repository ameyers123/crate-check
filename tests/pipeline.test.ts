import { describe, expect, it } from "vitest";
import { PRESETS, STEPS, STEP_BY_ID, evaluate } from "../lib/pipeline/steps";
import type { StepId } from "../lib/pipeline/steps";
import {
  alignmentAt,
  bestStartBar,
  describeBar,
  introBars,
  phraseAnchor,
  planTransition,
  secondsPerBar,
  structureOf,
  waveformByBar,
} from "../lib/library/phrasing";
import { buildCatalog } from "../lib/library/build-catalog";
import { tagLibrary } from "../lib/library/tagger";

/* ------------------------------------------------------------ the model -- */

describe("pipeline model", () => {
  it("numbers the steps 1 to 11 in order", () => {
    expect(STEPS.map((s) => s.n)).toEqual(Array.from({ length: 11 }, (_, i) => i + 1));
  });

  it("every consequence lands on a real step that comes later", () => {
    for (const s of STEPS) {
      for (const c of s.ifSkipped) {
        const target = STEP_BY_ID[c.hits];
        expect(target, `${s.id} -> ${c.hits}`).toBeDefined();
        expect(target.n, `${s.id} -> ${c.hits}`).toBeGreaterThan(s.n);
      }
    }
  });

  it("uses every level, and is honest that tagging is optional", () => {
    const levels = new Set(STEPS.map((s) => s.level));
    expect(levels).toEqual(new Set(["required", "recommended", "optional"]));
    expect(STEP_BY_ID.tag.level).toBe("optional");
    expect(STEP_BY_ID.tag.crateCheck).toBe("does it");
  });

  it("gives every step something to say when it's skipped", () => {
    for (const s of STEPS) expect(s.skipNote.length, s.id).toBeGreaterThan(0);
  });

  it("every required step except the last breaks something when skipped", () => {
    for (const s of STEPS.filter((x) => x.level === "required" && x.id !== "transition")) {
      expect(s.ifSkipped.length, s.id).toBeGreaterThan(0);
    }
  });
});

/* ----------------------------------------------------------- evaluation -- */

describe("skipping steps", () => {
  it("skipping nothing ends in a clean transition", () => {
    const ev = evaluate([]);
    expect(ev.skippedCount).toBe(0);
    expect(ev.blockedCount).toBe(0);
    expect(ev.degradedCount).toBe(0);
    expect(ev.outcome.tone).toBe("good");
    for (const s of STEPS) expect(ev.states[s.id].status).toBe("ok");
  });

  it("skipping the beatgrid damages the transition with the drift problem", () => {
    const ev = evaluate(["beatgrid"]);
    expect(ev.states.beatgrid.status).toBe("skipped");
    expect(ev.states.transition.status).toBe("degraded");
    expect(ev.states.transition.hitBy.some((c) => c.from === "beatgrid" && c.severity === "severe")).toBe(true);
    expect(ev.outcome.tone).toBe("bad");
  });

  it("forgetting to export blocks everything in the booth", () => {
    const ev = evaluate(["export"]);
    expect(ev.states.load.status).toBe("blocked");
    // Load can't happen, so its own consequences cascade on to the transition.
    expect(ev.states.transition.status).toBe("blocked");
    expect(ev.outcome.text).toMatch(/never happens/);
  });

  it("no files blocks the whole prepare-and-play chain", () => {
    const ev = evaluate(["collect"]);
    for (const id of ["analyze", "tag", "beatgrid", "load", "transition"] as StepId[]) {
      expect(ev.states[id].status, id).toBe("blocked");
    }
  });

  it("skipping only optional steps still gets you a working set", () => {
    const optional = STEPS.filter((s) => s.level === "optional").map((s) => s.id);
    const ev = evaluate(optional);
    expect(ev.blockedCount).toBe(0);
    expect(ev.outcome.tone).toBe("ok");
    expect(ev.states.transition.status).not.toBe("blocked");
  });

  it("skipping the transition itself isn't a failure upstream", () => {
    const ev = evaluate(["transition"]);
    expect(ev.blockedCount).toBe(0);
    expect(ev.degradedCount).toBe(0);
    expect(ev.outcome.tone).toBe("none");
  });

  it("every preset names real steps and produces a reaction", () => {
    for (const p of PRESETS) {
      for (const id of p.skip) expect(STEP_BY_ID[id], `${p.label}: ${id}`).toBeDefined();
      const ev = evaluate(p.skip);
      expect(ev.outcome.tone, p.label).not.toBe("good");
    }
  });
});

/* -------------------------------------------------------------- phrasing -- */

const tracks = tagLibrary(buildCatalog()).tracks;

describe("phrasing maths", () => {
  it("a bar at 120 BPM lasts two seconds", () => {
    expect(secondsPerBar(120)).toBe(2);
    expect(secondsPerBar(124)).toBeCloseTo(1.935, 3);
  });

  it("buckets start points by phrase", () => {
    expect(alignmentAt(0)).toBe("phrase");
    expect(alignmentAt(64)).toBe("phrase");
    expect(alignmentAt(16)).toBe("half-phrase");
    expect(alignmentAt(48)).toBe("half-phrase");
    expect(alignmentAt(7)).toBe("off");
    expect(alignmentAt(33)).toBe("off");
  });

  it("describes bars the way a DJ counts them", () => {
    expect(describeBar(0)).toBe("bar 1 of phrase 1");
    expect(describeBar(48)).toBe("bar 17 of phrase 2");
  });

  it("sizes the runway from the intro type", () => {
    const by = (intro: string) => tracks.find((t) => t.features.intro === intro)!;
    expect(introBars(by("long mixable"))).toBe(32);
    expect(introBars(by("short"))).toBe(8);
  });
});

describe("track structure", () => {
  it("lays every section out in multiples of 8 bars, end to end", () => {
    for (const t of tracks) {
      const { sections, totalBars } = structureOf(t);
      let at = 0;
      for (const s of sections) {
        expect(s.startBar, t.title).toBe(at);
        expect(s.bars % 8, `${t.title} ${s.kind}`).toBe(0);
        at += s.bars;
      }
      expect(at, t.title).toBe(totalBars);
    }
  });

  it("puts every cue inside the track, mix-in first and outro loop last", () => {
    for (const t of tracks) {
      const { cues, totalBars } = structureOf(t);
      expect(cues[0].label).toBe("Mix in");
      expect(cues[cues.length - 1].label).toBe("Outro loop");
      for (const c of cues) {
        expect(c.bar).toBeGreaterThanOrEqual(0);
        expect(c.bar).toBeLessThan(totalBars);
      }
    }
  });

  it("gives one waveform value per bar", () => {
    for (const t of tracks.slice(0, 8)) {
      expect(waveformByBar(t).length).toBe(structureOf(t).totalBars);
    }
  });

  it("only gives a breakdown cue to tracks with a breakdown", () => {
    for (const t of tracks) {
      const has = structureOf(t).cues.some((c) => c.label === "Breakdown");
      expect(has, t.title).toBe(t.features.hasBreakdown);
    }
  });
});

describe("transitions", () => {
  const a = tracks.find((t) => t.features.intro === "long mixable" && t.features.bpm === 124)!;
  const b = tracks.find((t) => t.id !== a.id && t.features.intro === "long mixable" && t.features.bpm === 124)!;

  it("the textbook start lines the phrases up", () => {
    expect(planTransition(a, b, bestStartBar(a, b)).alignment).toBe("phrase");
  });

  it("a short-intro record starts early, so its first phrase lands on the boundary", () => {
    const short = tracks.find((t) => t.features.intro === "short")!;
    const start = bestStartBar(a, short);
    const plan = planTransition(a, short, start);
    expect(phraseAnchor(short)).toBe(8);
    expect(alignmentAt(start)).toBe("off"); // pressing play is off the boundary...
    expect(plan.alignment).toBe("phrase"); // ...so that the phrases line up
    expect(plan.bassSwapAlignment).toBe("phrase");
  });

  it("starting a short-intro record exactly on the boundary puts it off the phrase", () => {
    const short = tracks.find((t) => t.features.intro === "short")!;
    expect(planTransition(a, short, 64).alignment).toBe("off");
  });

  it("a phrase-aligned start puts the bass swap on a phrase too", () => {
    const plan = planTransition(a, b, bestStartBar(a, b));
    expect(plan.alignment).toBe("phrase");
    expect(plan.bassSwapAlignment).toBe("phrase");
  });

  it("starting off the phrase drags the bass swap off it too", () => {
    const start = bestStartBar(a, b) - 5;
    const plan = planTransition(a, b, start);
    expect(plan.alignment).toBe("off");
    expect(plan.bassSwapAlignment).toBe("off");
  });

  it("never overlaps past the end of the outgoing record", () => {
    const { totalBars } = structureOf(a);
    const plan = planTransition(a, b, totalBars - 10);
    expect(plan.startBar + plan.overlapBars).toBeLessThanOrEqual(totalBars);
  });

  it("reports the pitch change needed to match tempo", () => {
    const fast = tracks.find((t) => t.features.bpm > 128)!;
    const plan = planTransition(a, fast, 0);
    expect(plan.pitchPct).toBeLessThan(0);
  });
});

/* ---------------------------------------- planned sets have to be mixable -- */

import { SET_SHAPES, planSet } from "../lib/library/setshapes";
import { keyDistance } from "../lib/library/mixing";

describe("planned sets can actually be mixed", () => {
  // The transition view draws its pairs from the planned set, so a set that
  // can't be mixed track-to-track makes every transition in it a bad example.
  for (const shape of SET_SHAPES) {
    const plan = planSet(shape, tracks);
    const pairs = plan.slice(1).map((s, i) => [plan[i].track, s.track] as const);

    it(`${shape.name}: no consecutive tempo jump beyond 6%`, () => {
      for (const [a, b] of pairs) {
        const jump = Math.abs(a.features.bpm - b.features.bpm) / a.features.bpm;
        expect(jump, `${a.title} -> ${b.title}`).toBeLessThanOrEqual(0.06);
      }
    });

    it(`${shape.name}: at least half the transitions are key-compatible`, () => {
      const ok = pairs.filter(([a, b]) => (keyDistance(a.features.key, b.features.key) ?? 9) <= 1);
      expect(ok.length / pairs.length).toBeGreaterThanOrEqual(0.5);
    });

    it(`${shape.name}: stays inside its tempo band`, () => {
      const [lo, hi] = shape.bpm;
      const inBand = plan.filter((s) => s.track.features.bpm >= lo - 2 && s.track.features.bpm <= hi + 2);
      expect(inBand.length, shape.name).toBe(plan.length);
    });
  }
});

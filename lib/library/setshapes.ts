/**
 * Set shapes.
 *
 * A set has a job, and the job decides the curve. Opening for someone else is
 * a different task from closing a room at 4am, and the classic warm-up → peak
 * → comedown arc is only one of several — it happens to be the one people
 * picture when they say "a DJ set".
 *
 * Each shape is a target energy at each point in the set. The planner fills
 * those slots from the library, preferring tracks whose energy and function
 * match what that point needs.
 */

import type { TaggedTrack } from "./types";
import { keyDistance } from "./mixing";

export interface SetShape {
  id: string;
  name: string;
  job: string;
  /** Target energy (1-10) at each slot, start to finish. */
  curve: number[];
  /** Function tags that suit this shape, in rough order of preference. */
  phases: string[];
  /**
   * The tempo range the set lives in. Energy alone isn't enough: a low-energy
   * pop record at 85 BPM is not an after-hours record, however calm it is.
   */
  bpm: [number, number];
  length: string;
}

export const SET_SHAPES: SetShape[] = [
  {
    id: "classic",
    name: "Classic arc",
    job: "A full night of your own. Build patiently, peak once, bring it down.",
    curve: [3, 4, 6, 7, 8, 9, 9, 7, 5],
    phases: ["Warm-up", "Driving", "Peak", "Afterhours"],
    bpm: [112, 130],
    length: "3–4 hours",
  },
  {
    id: "opening",
    name: "Opening set",
    job: "Warm the room for someone else. The cardinal rule is not to peak — you hand over a floor that still has somewhere to go.",
    curve: [2, 3, 4, 5, 5, 6, 6],
    phases: ["Warm-up", "Driving"],
    bpm: [112, 124],
    length: "90 minutes",
  },
  {
    id: "peaktime",
    name: "Peak-time",
    job: "The room is already full and already moving. No warm-up — start where the last DJ left off and push.",
    curve: [8, 9, 9, 10, 10, 9, 9],
    phases: ["Peak", "Driving"],
    bpm: [122, 132],
    length: "60–90 minutes",
  },
  {
    id: "closing",
    name: "Closing / after-hours",
    job: "Take a tired room down gently. Longer blends, more repetition, fewer vocals.",
    curve: [7, 6, 5, 5, 4, 4, 3],
    phases: ["Afterhours", "Warm-up"],
    bpm: [116, 126],
    length: "2–3 hours",
  },
  {
    id: "sunset",
    name: "Sunset",
    job: "Warm and groovy, mid-tempo, nothing aggressive. People are talking as much as dancing.",
    curve: [4, 5, 6, 6, 6, 5],
    phases: ["Warm-up", "Driving"],
    bpm: [105, 124],
    length: "2 hours",
  },
  {
    id: "festival",
    name: "Festival slot",
    job: "A short slot in daylight to a crowd that didn't necessarily come for you. No patience for a build — land something recognisable early.",
    curve: [7, 8, 9, 10, 10],
    phases: ["Peak", "Driving"],
    bpm: [120, 132],
    length: "45–60 minutes",
  },
];

export interface PlannedSlot {
  target: number;
  track: TaggedTrack;
  /** Why this track was chosen for this slot. */
  why: string;
}

/**
 * Fill a shape's curve from the library.
 *
 * Greedy: each slot takes the best unused track for its target energy, with a
 * bonus for carrying one of the shape's preferred function tags and a penalty
 * for jumping tempo too hard from the previous slot.
 */
export function planSet(shape: SetShape, library: TaggedTrack[]): PlannedSlot[] {
  const used = new Set<string>();
  const slots: PlannedSlot[] = [];

  for (const target of shape.curve) {
    let best: { t: TaggedTrack; score: number; why: string } | null = null;

    for (const t of library) {
      if (used.has(t.id)) continue;

      const energyGap = Math.abs(t.energy - target);
      let score = 10 - energyGap * 2.5;

      const [lo, hi] = shape.bpm;
      const outside = t.features.bpm < lo ? lo - t.features.bpm : t.features.bpm > hi ? t.features.bpm - hi : 0;
      if (outside > 0) score -= 1.5 + outside * 0.3;

      const phaseHit = shape.phases.find((p) => t.tags.some((x) => x.name === p));
      if (phaseHit) score += 3 - shape.phases.indexOf(phaseHit) * 0.5;

      const prev = slots[slots.length - 1]?.track;
      let keyNote = "";
      if (prev) {
        // Graduated: a 29% jump has to cost more than a 7% one, or the planner
        // will happily open a set with one.
        const jump = Math.abs(t.features.bpm - prev.features.bpm) / prev.features.bpm;
        if (jump > 0.06) score -= 4 + (jump - 0.06) * 40;
        else if (jump > 0.03) score -= 1.2;

        // Consecutive slots get mixed into each other, so prefer keys that
        // sit together. Weighted below energy: the curve is the job, the key
        // is what decides whether each step of it can be blended.
        const kd = keyDistance(prev.features.key, t.features.key);
        if (kd !== null) {
          if (kd <= 1) {
            score += 1.5;
            keyNote = `key ${prev.features.key} → ${t.features.key} mixes`;
          } else if (kd >= 3) {
            score -= 1.5;
          }
        }
      }

      if (!best || score > best.score) {
        const bits = [`energy ${t.energy}/10 against a target of ${target}`];
        if (phaseHit) bits.push(`tagged ${phaseHit}`);
        if (keyNote) bits.push(keyNote);
        best = { t, score, why: bits.join(", ") };
      }
    }

    if (!best) break;
    used.add(best.t.id);
    slots.push({ target, track: best.t, why: best.why });
  }

  return slots;
}

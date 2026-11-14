/**
 * The whole pipeline, from hearing a record to mixing it on a CDJ.
 *
 * Each step says what it does, who does it, whether it's required, and what
 * breaks if you skip it. The point of modelling the skips is that most DJ prep
 * advice is a list of things you "should" do; the useful question is which
 * ones you can get away with skipping and what it costs you when you can't.
 *
 * Severity, deliberately narrow:
 *   blocking — the later step can't happen at all
 *   severe   — it happens, and goes audibly wrong in front of people
 *   annoying — it happens, slower and riskier than it needed to be
 */

export type StepId =
  | "find"
  | "collect"
  | "check"
  | "analyze"
  | "tag"
  | "beatgrid"
  | "cues"
  | "plan"
  | "export"
  | "load"
  | "transition";

export type Level = "required" | "recommended" | "optional";
export type Severity = "blocking" | "severe" | "annoying";

/** How much of this step crate-check itself does. */
export type CrateCheckRole = "does it" | "helps" | "no";

export interface Consequence {
  /** The later step that suffers. */
  hits: StepId;
  severity: Severity;
  what: string;
}

export interface Step {
  id: StepId;
  n: number;
  name: string;
  sub: string;
  level: Level;
  phase: "Get the music" | "Prepare it" | "Play it";
  who: string;
  crateCheck: CrateCheckRole;
  time: string;
  does: string;
  why: string;
  /** What skipping this step means on its own terms. */
  skipNote: string;
  ifSkipped: Consequence[];
  /** Section id on the page, where there is one. */
  anchor: string;
}

export const STEPS: Step[] = [
  {
    id: "find",
    n: 1,
    name: "Find",
    sub: "Decide what you want",
    level: "optional",
    phase: "Get the music",
    who: "You, wherever you listen",
    crateCheck: "no",
    time: "Ongoing",
    does: "Hear records in saves, charts, playlists and other DJs' sets, and decide which ones you want to play.",
    why: "It's the only step that adds anything new. Everything after it works on what you already chose.",
    skipNote: "You play what you already own.",
    ifSkipped: [
      {
        hits: "plan",
        severity: "annoying",
        what: "Nothing new to plan with. Sets drift toward the same records you've played for a year.",
      },
    ],
    anchor: "find",
  },
  {
    id: "collect",
    n: 2,
    name: "Collect",
    sub: "Get the files",
    level: "required",
    phase: "Get the music",
    who: "You — stores, promos, labels",
    crateCheck: "no",
    time: "Minutes per track",
    does: "Get the actual audio files onto your disk, ideally lossless, from sources you're entitled to use.",
    why: "A CDJ plays files. No file, no track.",
    skipNote: "There are no files.",
    ifSkipped: [
      {
        hits: "analyze",
        severity: "blocking",
        what: "No files, so there is nothing to analyze, prepare or play.",
      },
      {
        hits: "export",
        severity: "blocking",
        what: "Nothing to put on the USB stick.",
      },
    ],
    anchor: "collect",
  },
  {
    id: "check",
    n: 3,
    name: "Check",
    sub: "Is each file what it claims?",
    level: "recommended",
    phase: "Get the music",
    who: "crate-check",
    crateCheck: "does it",
    time: "Seconds per batch",
    does: "Catch files that aren't what their name says: festival sets filed as singles, truncated clips, a Radio Edit that runs nine minutes, two copies of one track at different lengths.",
    why: "Bulk downloads go wrong quietly. The file looks fine in a list until you load it.",
    skipNote: "Wrong files go into the library alongside the good ones.",
    ifSkipped: [
      {
        hits: "plan",
        severity: "annoying",
        what: "A broken file can land in a planned set slot without anyone noticing.",
      },
      {
        hits: "transition",
        severity: "severe",
        what: "You load what you think is a three-minute single and it's a 47-minute festival recording. You find out in front of people.",
      },
    ],
    anchor: "check",
  },
  {
    id: "analyze",
    n: 4,
    name: "Analyze",
    sub: "Measure the audio",
    level: "required",
    phase: "Prepare it",
    who: "Rekordbox · Mixed In Key · Essentia",
    crateCheck: "helps",
    time: "Seconds per track, automatic",
    does: "Measure BPM, key, loudness and the waveform, and — with a model like Essentia — probabilities for mood and genre.",
    why: "Every later step runs on these numbers. The CDJ's BPM, key and waveform displays all come from here.",
    skipNote: "The library has names and lengths, nothing else.",
    ifSkipped: [
      {
        hits: "tag",
        severity: "blocking",
        what: "No numbers, so nothing to turn into tags.",
      },
      {
        hits: "beatgrid",
        severity: "blocking",
        what: "No beatgrid exists yet, so there's nothing to check or fix.",
      },
      {
        hits: "load",
        severity: "severe",
        what: "No BPM, key or waveform on the CDJ screen. You pick and match by ear on a blank display.",
      },
    ],
    anchor: "listen",
  },
  {
    id: "tag",
    n: 5,
    name: "Tag",
    sub: "Turn numbers into words",
    level: "optional",
    phase: "Prepare it",
    who: "crate-check",
    crateCheck: "does it",
    time: "Automatic, a minute to review",
    does: "Turn analysis numbers into genre, feel, function and role tags — Hypnotic, Warm-up, Floor Saver — each with the rule that produced it.",
    why: "BPM and key tell you what will mix. Tags tell you what fits the room. Optional, honestly: DJs have played without them forever.",
    skipNote: "You can still mix — you just can't search by feel.",
    ifSkipped: [
      {
        hits: "plan",
        severity: "annoying",
        what: "Planning by BPM and key only. Nothing tells a warm-up record from a peak one.",
      },
      {
        hits: "load",
        severity: "annoying",
        what: "Finding the next track by filename. You default to the forty records you can remember.",
      },
    ],
    anchor: "analyze",
  },
  {
    id: "beatgrid",
    n: 6,
    name: "Beatgrid",
    sub: "Check where the beats fall",
    level: "required",
    phase: "Prepare it",
    who: "Rekordbox — auto, then you fix it",
    crateCheck: "no",
    time: "A minute per track that needs it",
    does: "Check the automatically detected grid of beats and bars against the actual kicks, and correct it where it's wrong.",
    why: "Auto-detection is right on most programmed dance records and wrong on live drums, swung grooves and older records with tempo drift. Sync, quantize, loops and cues all trust the grid.",
    skipNote: "Most tracks are fine. The ones that aren't fail without telling you.",
    ifSkipped: [
      {
        hits: "cues",
        severity: "severe",
        what: "Cues and loops snap to a wrong grid, so a quantized cue fires a fraction of a beat late.",
      },
      {
        hits: "transition",
        severity: "severe",
        what: "Sync holds for a few bars and then drifts. By bar 32 the two kicks are audibly flamming.",
      },
    ],
    anchor: "beatgrid",
  },
  {
    id: "cues",
    n: 7,
    name: "Cue points",
    sub: "Mark where things happen",
    level: "recommended",
    phase: "Prepare it",
    who: "Rekordbox · Mixed In Key",
    crateCheck: "no",
    time: "A couple of minutes per track",
    does: "Save hot cues on the waveform: where to mix in, the breakdown, the drop, and a loop in the outro.",
    why: "In the booth you press a pad instead of hunting along a waveform while the other record runs out.",
    skipNote: "Every track starts from the beginning.",
    ifSkipped: [
      {
        hits: "transition",
        severity: "annoying",
        what: "You scrub the waveform to find the mix-in point live, with the outgoing record running out.",
      },
    ],
    anchor: "cues",
  },
  {
    id: "plan",
    n: 8,
    name: "Plan",
    sub: "Shape the set",
    level: "optional",
    phase: "Prepare it",
    who: "crate-check",
    crateCheck: "does it",
    time: "An hour before the gig",
    does: "Pick a set shape for the job — opening, peak-time, closing — and pull a short crate whose energy fits it.",
    why: "Deciding live from a short list you already trust is faster and safer than deciding from everything.",
    skipNote: "You improvise from the whole library.",
    ifSkipped: [
      {
        hits: "load",
        severity: "annoying",
        what: "Every next-track decision is made from the whole library, under time pressure, instead of from a shortlist.",
      },
    ],
    anchor: "plan",
  },
  {
    id: "export",
    n: 9,
    name: "Export",
    sub: "Put it on the USB",
    level: "required",
    phase: "Prepare it",
    who: "Rekordbox",
    crateCheck: "no",
    time: "Minutes",
    does: "Write the tracks — with their grids, cues, playlists and tags — to a USB stick in the format the CDJ reads.",
    why: "The CDJ doesn't see your laptop. Whatever isn't on the stick doesn't exist in the booth.",
    skipNote: "The booth has nothing to play.",
    ifSkipped: [
      {
        hits: "load",
        severity: "blocking",
        what: "The tracks aren't on the stick. Nothing downstream happens.",
      },
    ],
    anchor: "export",
  },
  {
    id: "load",
    n: 10,
    name: "Load & find",
    sub: "Pick what goes next",
    level: "required",
    phase: "Play it",
    who: "You, on the CDJ",
    crateCheck: "helps",
    time: "Under two minutes, live",
    does: "While one record plays, find the next one and load it onto the free deck.",
    why: "This is the decision the whole pipeline exists to make easier.",
    skipNote: "The second deck is empty.",
    ifSkipped: [
      {
        hits: "transition",
        severity: "blocking",
        what: "Nothing on the second deck to mix into.",
      },
    ],
    anchor: "live",
  },
  {
    id: "transition",
    n: 11,
    name: "Transition",
    sub: "Mix it in",
    level: "required",
    phase: "Play it",
    who: "You, on the CDJ and mixer",
    crateCheck: "helps",
    time: "16 to 64 bars",
    does: "Match tempo, start the incoming record on a phrase, swap the bass lines, and bring the outgoing record out.",
    why: "It's what everything above was for.",
    skipNote: "You stop one record and start the next. That's a playlist, not a set.",
    ifSkipped: [],
    anchor: "transition",
  },
];

export const STEP_BY_ID: Record<StepId, Step> = Object.fromEntries(
  STEPS.map((s) => [s.id, s]),
) as Record<StepId, Step>;

export type StepStatus = "ok" | "skipped" | "blocked" | "degraded";

export interface StepState {
  status: StepStatus;
  /** Consequences landing on this step from skipped or blocked steps upstream. */
  hitBy: (Consequence & { from: StepId })[];
}

export interface Evaluation {
  states: Record<StepId, StepState>;
  skippedCount: number;
  blockedCount: number;
  degradedCount: number;
  outcome: { tone: "good" | "ok" | "bad" | "none"; text: string };
}

/**
 * Work out what happens when a set of steps is skipped.
 *
 * A step that's blocked by something upstream effectively doesn't happen
 * either, so its own consequences cascade on. Steps are evaluated in order,
 * which makes that a single pass.
 */
export function evaluate(skipped: Iterable<StepId>): Evaluation {
  const userSkipped = new Set(skipped);
  const states = {} as Record<StepId, StepState>;
  for (const s of STEPS) states[s.id] = { status: "ok", hitBy: [] };

  for (const step of STEPS) {
    const st = states[step.id];
    const blocked = st.hitBy.some((c) => c.severity === "blocking");

    if (userSkipped.has(step.id)) st.status = "skipped";
    else if (blocked) st.status = "blocked";
    else if (st.hitBy.length > 0) st.status = "degraded";

    if (st.status === "skipped" || st.status === "blocked") {
      for (const c of step.ifSkipped) {
        states[c.hits].hitBy.push({ ...c, from: step.id });
      }
    }
  }

  const count = (s: StepStatus) => STEPS.filter((x) => states[x.id].status === s).length;

  const last = states.transition;
  let outcome: Evaluation["outcome"];
  if (last.status === "skipped") {
    outcome = { tone: "none", text: "No transition. One record stops, the next one starts." };
  } else if (last.status === "blocked") {
    outcome = { tone: "bad", text: "The transition never happens. Something upstream stopped the chain." };
  } else if (last.hitBy.some((c) => c.severity === "severe")) {
    outcome = { tone: "bad", text: "The transition happens, and goes audibly wrong in front of people." };
  } else if (last.hitBy.length > 0 || count("degraded") > 0) {
    outcome = { tone: "ok", text: "It works. It's slower and riskier than it needed to be." };
  } else {
    outcome = { tone: "good", text: "A clean transition, on the phrase, from a file you trust." };
  }

  return {
    states,
    skippedCount: count("skipped"),
    blockedCount: count("blocked"),
    degradedCount: count("degraded"),
    outcome,
  };
}

/** Handy starting points for the interactive map. */
export const PRESETS: { label: string; skip: StepId[] }[] = [
  { label: "Rushed before a gig", skip: ["check", "beatgrid", "cues"] },
  { label: "Only what's required", skip: ["find", "check", "tag", "cues", "plan"] },
  { label: "Forgot to export", skip: ["export"] },
];

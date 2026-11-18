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
 *
 * Two layers live in one map. The steps are the workflow; `engine` says what
 * crate-engine, the private tool this demo is the public face of, does at that
 * step and how far it has actually got. Steps the engine doesn't touch have no
 * `engine`.
 */

export type StepId =
  | "find"
  | "match"
  | "collect"
  | "check"
  | "library"
  | "import"
  | "analyze"
  | "tag"
  | "crates"
  | "beatgrid"
  | "cues"
  | "plan"
  | "export"
  | "load"
  | "transition";

export type Level = "required" | "recommended" | "optional";
export type Severity = "blocking" | "severe" | "annoying";

/** How much of this step the public demo itself does. */
export type CrateCheckRole = "does it" | "helps" | "no";

/**
 * How far the engine's version of a step has got.
 *   proven  — run end to end on real data
 *   tested  — works, but only on a scratch copy; not yet run on a real library
 *   scripts — works as loose scripts; not yet one command
 *   planned — not built
 *   manual  — a person does it by hand, in another tool
 */
export type EngineStatus = "proven" | "tested" | "scripts" | "planned" | "manual";

export const ENGINE_STATUS_LABEL: Record<EngineStatus, string> = {
  proven: "Proven",
  tested: "Tested, not live yet",
  scripts: "Works, not one command yet",
  planned: "Not built",
  manual: "You do it",
};

export interface EngineStage {
  /** What the engine calls its stage(s) at this step. */
  stage: string;
  status: EngineStatus;
  does: string;
  /** What isn't done, isn't confirmed, or needs a caveat. */
  open?: string;
}

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
  /** What the private engine does here, if anything. */
  engine?: EngineStage;
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
    engine: {
      stage: "Request, manifest",
      status: "proven",
      does: "Turns a playlist link, an exported CSV of liked songs or a plain text file of Artist – Title lines into one ordered want list. Every input ends up the same shape, so every later step is written once.",
      open: "A genre brief as the input (“top afro house right now”) isn't built.",
    },
    anchor: "find",
  },
  {
    id: "match",
    n: 2,
    name: "Match",
    sub: "What do you already own?",
    level: "required",
    phase: "Get the music",
    who: "crate-engine",
    crateCheck: "no",
    time: "Seconds per list",
    does: "Compare the want list with the files you already own and sort every song: owned, needs a look (you have the remix, not the original), or missing.",
    why: "Without it you collect songs you already have and end up with two copies. It's also the guard against the wrong version: a remix gets flagged, never quietly swapped in for the original.",
    skipNote: "You can't tell what's missing, so you collect things you already own.",
    ifSkipped: [
      {
        hits: "collect",
        severity: "annoying",
        what: "You collect songs you already own and end up with duplicates. A remix can stand in for the original without anyone noticing.",
      },
      {
        hits: "import",
        severity: "annoying",
        what: "There's no ordered list of what you own to import, so you rebuild the order by hand in Rekordbox.",
      },
    ],
    engine: {
      stage: "Match",
      status: "proven",
      does: "Checks each wanted song against an index of the library, which it only reads. Accents and featured-artist spellings are normalized, so Callaíta and Callaita are one song and “A ft. B” is two artists. It re-runs whenever new files arrive.",
    },
    anchor: "match",
  },
  {
    id: "collect",
    n: 3,
    name: "Collect",
    sub: "Get the files",
    level: "required",
    phase: "Get the music",
    who: "You — stores, promos, labels, friends",
    crateCheck: "no",
    time: "Minutes per track",
    does: "Get the actual audio files onto your disk, ideally lossless: buy them, get them from a label or promo pool, or bring them from a friend's USB or a folder you already own. Only the ones Match says are missing.",
    why: "A CDJ plays files. No file, no track.",
    skipNote: "There are no files.",
    ifSkipped: [
      {
        hits: "library",
        severity: "blocking",
        what: "No files, so there is nothing to add to the library.",
      },
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
    engine: {
      stage: "Ingest",
      status: "tested",
      does: "For files that arrive from outside — a friend's folder, a USB stick, a purchase. It matches the folder against the want list: clean matches go on, doubtful ones (a remix, a low bitrate, a lyric-video rip) go to a review folder, and everything else stays where it is.",
      open: "Tested on real files as a dry run. Copying into a real library is the next step.",
    },
    anchor: "collect",
  },
  {
    id: "check",
    n: 4,
    name: "Check",
    sub: "Is each file what it claims?",
    level: "recommended",
    phase: "Get the music",
    who: "crate-check",
    crateCheck: "does it",
    time: "Seconds per batch",
    does: "Catch files that aren't what their name says: festival sets filed as singles, truncated clips, a Radio Edit that runs nine minutes, two copies of one track at different lengths.",
    why: "Bulk collecting goes wrong quietly. The file looks fine in a list until you load it.",
    skipNote: "Wrong files go into the library alongside the good ones.",
    ifSkipped: [
      {
        hits: "library",
        severity: "annoying",
        what: "A wrong file gets into the library, and every playlist points at it from then on.",
      },
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
    engine: {
      stage: "Check against the want list",
      status: "scripts",
      does: "Compares each file with what the want list says it should be: its length against the real recording's, and whether it's the right version. A file can carry the right tags and the wrong audio — a live take, a karaoke version, a sped-up edit.",
      open: "An audio-fingerprint check against a short reference clip of the real recording is being built. Until then this catches length and metadata problems, not wrong audio.",
    },
    anchor: "check",
  },
  {
    id: "library",
    n: 5,
    name: "Library",
    sub: "Copy the good files in",
    level: "required",
    phase: "Get the music",
    who: "crate-engine",
    crateCheck: "no",
    time: "Seconds per batch",
    does: "Copy files that passed the check into the one folder your playlists point at. Songs you already have are skipped, near-matches go to a review folder, nothing is overwritten and the original is never moved.",
    why: "Playlists only point at the library; it's the one place your music lives. One safe door in keeps duplicates, wrong versions and half-copied files out.",
    skipNote: "New files stay where they landed, outside the library.",
    ifSkipped: [
      {
        hits: "import",
        severity: "annoying",
        what: "The playlist is built without the new tracks, so the order you planned has gaps.",
      },
      {
        hits: "tag",
        severity: "annoying",
        what: "New files never get labeled, so they don't turn up in tag-based searches or crates.",
      },
    ],
    engine: {
      stage: "Promote",
      status: "tested",
      does: "A dry run unless told to apply. It records where each file came from, then re-runs Match so the new songs land in the playlist in order.",
      open: "Tested on a scratch library with MP3, M4A and FLAC. The first run against a real library is next.",
    },
    anchor: "library",
  },
  {
    id: "import",
    n: 6,
    name: "Import",
    sub: "Get them into Rekordbox, in order",
    level: "required",
    phase: "Prepare it",
    who: "crate-engine writes it, you import",
    crateCheck: "no",
    time: "Minutes",
    does: "Import the songs you own into Rekordbox as one playlist, in order. This is where tracks first become Rekordbox's, and where it starts analyzing them.",
    why: "Building a hundred-song playlist by hand takes ages and loses the order. One import file does it in a drag.",
    skipNote: "Nothing is in Rekordbox, so nothing gets analyzed or exported.",
    ifSkipped: [
      {
        hits: "analyze",
        severity: "blocking",
        what: "Rekordbox analyzes what it has imported. Nothing imported, nothing analyzed.",
      },
      {
        hits: "export",
        severity: "blocking",
        what: "Nothing in Rekordbox to put on the USB.",
      },
    ],
    engine: {
      stage: "Playlist files",
      status: "proven",
      does: "Writes the songs you own, in order, as a Rekordbox XML and an M3U8 playlist (import either), plus a list of what's still missing and a short report. Without the file you can still import loose and order by hand.",
      open: "Not yet confirmed: that one import keeps the order all the way to the USB and the CDJ.",
    },
    anchor: "import",
  },
  {
    id: "analyze",
    n: 7,
    name: "Analyze",
    sub: "Measure the audio",
    level: "required",
    phase: "Prepare it",
    who: "Rekordbox · Mixed In Key · Essentia",
    crateCheck: "helps",
    time: "Seconds per track, automatic",
    does: "Measure BPM, key, loudness and the waveform, and — with a model like Essentia — probabilities for mood and genre.",
    why: "Every later step runs on these numbers. The CDJ's BPM, key and waveform displays all come from here. Key is the shakiest of them: detectors disagree often on dance music, so keys come from Rekordbox or Mixed In Key, never from this project.",
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
    engine: {
      stage: "Snapshot",
      status: "proven",
      does: "Copies Rekordbox's database and reads only the copy: BPM, key, comments and rating for every track, joined to the audio-analysis labels. Rekordbox's own files are never written to.",
      open: "Keys are Rekordbox's, not the engine's. Comparing Rekordbox with Essentia on a 100-track sample, both named the same key for 63; another 18 were a wheel step or a relative major/minor apart, and 19 were genuinely different. Neither is the ground truth, so the engine reports where they disagree instead of picking a winner.",
    },
    anchor: "listen",
  },
  {
    id: "tag",
    n: 8,
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
        hits: "crates",
        severity: "blocking",
        what: "No tags, so there is nothing to sort into crates.",
      },
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
    engine: {
      stage: "Label",
      status: "scripts",
      does: "Essentia listens to the audio and returns probabilities for genre, mood and vocals. The same frozen cutoffs and vocabulary shown on this page turn them into tags.",
      open: "Done for the whole library with scripts. One command for newly added files is next.",
    },
    anchor: "analyze",
  },
  {
    id: "crates",
    n: 9,
    name: "Crates",
    sub: "Turn tags into folders",
    level: "optional",
    phase: "Prepare it",
    who: "crate-engine · Rekordbox",
    crateCheck: "no",
    time: "Built once, then kept current",
    does: "Group the tags into a fixed set of folders — genre, vibe and set-function crates, plus combinations like Tech House · Driving — and import them into Rekordbox.",
    why: "Browsing thousands of tracks on a CDJ is slow. A crate lets you jump to a kind of record mid-set instead of searching for one.",
    skipNote: "You browse by playlist and filename.",
    ifSkipped: [
      {
        hits: "load",
        severity: "annoying",
        what: "Mid-set you scroll or search the whole USB instead of opening a folder.",
      },
    ],
    engine: {
      stage: "Crates",
      status: "planned",
      does: "About forty crate definitions exist. They are not yet a Rekordbox import.",
      open: "Building that import is next. So is testing whether Rekordbox keeps a smart playlist current from a tag we write, or whether the crates need re-importing.",
    },
    anchor: "crates",
  },
  {
    id: "beatgrid",
    n: 10,
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
    n: 11,
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
    n: 12,
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
    n: 13,
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
    engine: {
      stage: "USB export",
      status: "manual",
      does: "You do this in Rekordbox. The engine doesn't touch the stick, and the stick is always a snapshot: export again after any change.",
      open: "A short pre-gig checklist is next, followed once end to end.",
    },
    anchor: "export",
  },
  {
    id: "load",
    n: 14,
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
    n: 15,
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

/* ------------------------------------------------- where the engine is -- */

/** The date the engine statuses above and below were last checked. */
export const ENGINE_AS_OF = "2026-11-17";

export type PhaseStatus = "done" | "in progress" | "not started";

export interface EnginePhase {
  n: number;
  title: string;
  status: PhaseStatus;
  goal: string;
  why: string;
  done: string;
}

/**
 * The engine's build plan, in five phases. Statuses are a snapshot (see
 * ENGINE_AS_OF) and will go stale; the point is the order, and that the
 * demo says plainly how much of the engine exists.
 */
export const ENGINE_PHASES: EnginePhase[] = [
  {
    n: 0,
    title: "Consolidate",
    status: "in progress",
    goal: "Every step that worked once as a loose script becomes one command, all reading the same want list.",
    why: "One tool runs the same way every time, and is something an interface can sit on later.",
    done: "Every box on the map is a command, or a step a person does by hand. None are old scripts.",
  },
  {
    n: 1,
    title: "Prove each use case",
    status: "not started",
    goal: "Run each use case end to end: first on a tiny case (one owned song, one missing, one tricky remix), then on a real playlist.",
    why: "A command that works on a fixture can still fail on thousands of real files or a real Rekordbox import. A use case only counts once it has reached the USB.",
    done: "Every use case is marked proven, with the playlist it was proven on.",
  },
  {
    n: 2,
    title: "See everything",
    status: "done",
    goal: "Read-only pages that show what the engine did: every job, every track's state, the playlist in order, and the files waiting in review.",
    why: "The raw output is complete but hard to read. You should be able to understand and check the engine without asking it.",
    done: "From one index page you can open any job, see where each song stands, and listen to anything in review.",
  },
  {
    n: 3,
    title: "Buttons",
    status: "not started",
    goal: "Approve and reject from those pages, with each button running the same command a person would.",
    why: "Reviewing borderline files is the slowest manual step.",
    done: "You can listen to a file in review and send it to the library, or reject it, from the page.",
  },
  {
    n: 4,
    title: "Productize?",
    status: "in progress",
    goal: "Decide whether a version that works on other people's files is worth building, and keep this demo honest about what exists.",
    why: "crate-check is the public face of the project. The engine is the private part that does the work.",
    done: "This page shows the real engine, and there is a yes or no on a bring-your-own-files version.",
  },
];

/** The promises the engine keeps about your files. */
export const ENGINE_RULES: string[] = [
  "A dry run unless told to apply: it writes into the library only when you say so.",
  "Copies, never moves. Never overwrites.",
  "Reads a copy of Rekordbox's database. Never writes to it.",
];

/* ------------------------------------------------------------ evaluation -- */

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
  { label: "Only what's required", skip: ["find", "check", "tag", "crates", "cues", "plan"] },
  { label: "Forgot to export", skip: ["export"] },
  { label: "Didn't match first", skip: ["match"] },
];

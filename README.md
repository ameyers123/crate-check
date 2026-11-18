# crate-check

**Your DJ library knows BPM and key. It has no idea how anything feels.**

So you can't ask it for a hypnotic track around 126, or for something to open with, or for the record that will save a floor that's walking off. crate-check analyzes each file, tags it with genre, feel, where it belongs in a night and what it's for when things go wrong — then helps you plan a set beforehand and pick the next record live.

[**Try it →**](https://crate-check-delta.vercel.app) · runs in the browser, nothing to install

---

## The problem

Rekordbox manages your library and plays it. Lexicon cleans up metadata. Mixed In Key does key and energy. Between them you still can't answer the questions that actually come up:

- *What should I open with?*
- *Give me something hypnotic around 126.*
- *The floor is thinning — what do I drop right now that still mixes from here?*

BPM and key are measurable, so everyone has them. Feel isn't, so nobody does.

## The whole pipeline, and what happens when you skip a step

Getting a record from "I heard this" to mixing it on a CDJ takes fifteen steps. They aren't equally important, and the honest version of this table labels this project's own headline feature optional.

Two things are merged into one map. **crate-check** is this public demo. **crate-engine** is the private command-line tool behind it, which runs the same ideas against a real library: matching a want list against the files you own, adding new files safely, writing ordered playlists for Rekordbox, and reading Rekordbox's analysis from a copy. The last column says how far the engine has actually got at each step, including the steps it hasn't built.

| | step | level | who does it | this demo | engine |
|---|---|---|---|---|---|
| 1 | **Find** — decide what you want | optional | you | — | proven |
| 2 | **Match** — what do you already own? | required | crate-engine | — | proven |
| 3 | **Collect** — get the files: buy them or bring them | required | you | — | tested |
| 4 | **Check** — is each file what it claims? | recommended | crate-check | does it | scripts |
| 5 | **Library** — copy the good files in | required | crate-engine | — | tested |
| 6 | **Import** — get them into Rekordbox, in order | required | crate-engine writes it, you import | — | proven |
| 7 | **Analyze** — measure the audio | required | Rekordbox · Mixed In Key · Essentia | helps | proven |
| 8 | **Tag** — turn numbers into words | **optional** | crate-check | does it | scripts |
| 9 | **Crates** — turn tags into folders | optional | crate-engine · Rekordbox | — | not built |
| 10 | **Beatgrid** — check where the beats fall | required | Rekordbox, then you | — | — |
| 11 | **Cue points** — mark where things happen | recommended | Rekordbox · Mixed In Key | — | — |
| 12 | **Plan** — shape the set | optional | crate-check | does it | — |
| 13 | **Export** — put it on the USB | required | Rekordbox | — | you do it |
| 14 | **Load & find** — pick what goes next | required | you, on the CDJ | helps | — |
| 15 | **Transition** — mix it in | required | you | helps | — |

The engine column, as of 17 November 2026 (it will go stale): **proven** is run end to end on real data. **tested** works on a scratch copy and hasn't touched a real library yet. **scripts** works as loose scripts and isn't one command yet. **not built** is what it says. **you do it** is by hand, in another tool. A dash means the engine has no part in that step.

The three phases are **Get the music** (1–5), **Prepare it** (6–13) and **Play it** (14–15).

The page opens on this as an interactive map. Click a step to see what it involves, and what the engine does there; **skip it to see what breaks further down.** Every step declares which later steps it damages and how badly:

- **can't happen** — skip Export and the tracks aren't on the stick; Load & find and the Transition never happen
- **goes wrong** — skip the Beatgrid and sync holds for a few bars, then drifts; by bar 32 the kicks are flamming in front of people
- **slower, riskier** — skip Tagging and you find the next record by filename, defaulting to the forty you can remember; skip Match and you collect songs you already own, with a remix quietly standing in for the original

Blocked steps cascade, because a step that can't happen can't do its own job either. Presets show the common cases — *rushed before a gig*, *only what's required*, *forgot to export*, *didn't match first* — and a line at the bottom says where you end up.

### A note on key

Key is the least trustworthy number in the pipeline, and detectors disagree often on dance music. Comparing Rekordbox with Essentia on a 100-track sample, both named the same key for 63. Another 18 were a step round the Camelot wheel or a relative major/minor apart, which still mixes. 19 were genuinely different, and neither tool is the ground truth.

So crate-check never claims a key of its own. Keys come from Rekordbox, or from Mixed In Key if you use it. The keys in the demo catalog are illustrative, and the engine reports where detectors disagree instead of picking a winner.

## The engine behind it, phase by phase

crate-engine is private. This is the order it's being built in, as of 17 November 2026:

| phase | status | what it is |
|---|---|---|
| **0 Consolidate** | in progress | every step that worked once as a loose script becomes one command, all reading the same want list |
| **1 Prove each use case** | not started | run each end to end, first on a tiny case (one owned song, one missing, one tricky remix), then on a real playlist. A use case only counts once it has reached the USB |
| **2 See everything** | done | read-only pages for every job, every track's state, the playlist in order, and the files waiting in review |
| **3 Buttons** | not started | approve and reject from those pages, each button running the same command a person would |
| **4 Productize?** | in progress | decide whether a version that works on other people's files is worth building, and keep this demo honest about what exists |

The rules it keeps about your files:

- A dry run unless told to apply: it writes into the library only when you say so
- Copies, never moves. Never overwrites
- Reads a copy of Rekordbox's database. Never writes to it

## The tag vocabulary

Three descriptive groups plus a fourth that only matters under pressure.

**Genre** — House, Deep House, Tech House, Techno, Melodic House & Techno, Tropical / Sunset House, Disco / Nu-Disco, Bass House, Breaks, Trance, Hip-Hop, Pop / Open Format, Drum & Bass

**Feel** — Party, Happy, Relaxed, Hypnotic, Aggressive, Dark, Emotional, Groovy, Euphoric

**Function** — Vocal, Instrumental, Warm-up, Driving, Peak, Afterhours

**Role** — the back pocket:
- **Floor Saver** — the room knows it and it hits hard
- **Reset** — an anthem with a recognisable vocal; re-engages a drifting floor in two bars
- **Bridge / Tool** — instrumental, percussive, no strong key centre; sits under anything while you fix a clash
- **Safe Drop** — beatless or long intro, so you can bring it in without a tight beatmatch

Plus the per-track fields that decide whether a blend is physically possible: **energy 1–10**, **intro type** (beatless / long mixable / short / cold open), **outro** (clean / fade), **familiarity** (anthem / known / deep cut), **vocal detail** (male / female / spoken / chopped / none), **rhythm feel** (four-on-the-floor / broken / swung / halftime), and whether it has a **breakdown**.

Three things about how tagging works:

**Tags overlap on purpose.** A track can be Tech House *and* Techno, Party *and* Hypnotic. One genre slot per track is why library tools are bad at finding a specific record.

**Thresholds are frozen, and that was a decision.** They used to be percentiles of whatever library was in front of the tagger — "Dark" meaning dark relative to what *you* own. That sounds right, and it survives about one question: it means a record re-tags when its neighbours change, and filtering to a playlist re-bases every cutoff against a handful of songs. It doesn't survive its own logic either. Grow the library toward everything ever released and percentile-of-your-library converges on percentile-of-all-music, which is a fixed cutoff. Library-relative percentiles were only ever a small-sample stand-in for a global one.

The original worry was real — a fixed 0.7 would tag everything in a techno library and nothing in a disco one — but the fix for that is normalising the *input*, not making the *labels* relative. So cutoffs are measured once over the full 3,564-track corpus and committed as data. The relative reading is still there as a toggle in the Tag stage, and it's worth playing with: switch Mr. Brightside to library-relative and it picks up **Relaxed**.

**Every tag records why it fired.** Not `Hypnotic` but `Hypnotic — techno-family 0.61, approachability 0.14 ≤ p33, not top-quartile aggressive`. A tag you disagree with can be argued with.

## Six set shapes

A set has a job, and the job decides the curve.

| shape | energy | BPM | key-compatible transitions | job |
|---|---|---|---|---|
| **Classic arc** | 3→4→6→6→8→9→9→7→5 | 118–130 | 6 of 8 | a full night of your own, one peak |
| **Opening set** | 3→4→4→4→6→6→6 | 116–126 | 4 of 6 | warm the room, never peak, hand over with somewhere left to go |
| **Peak-time** | 8→9→10→10→10→9→9 | 124–130 | 4 of 6 | the room is already moving, start where the last DJ left off |
| **Closing / after-hours** | 7→6→4→5→4→4→4 | 116–126 | 4 of 6 | take a tired room down, longer blends, fewer vocals |
| **Sunset** | 4→4→6→6→6→4 | 116–126 | 5 of 5 | warm and groovy, mid-tempo, nothing aggressive |
| **Festival slot** | 7→8→9→10→10 | 124–130 | 2 of 4 | short, daylight, land something recognisable early |

Those are what the planner actually produced from the demo catalog, not targets.

The planner scores three things. **Energy** against the curve does most of the work. **Key** against the previous slot comes second — consecutive slots get mixed into each other, so a set that clashes on every transition isn't a plan. **Tempo** is a band per shape plus a graduated penalty for jumps. Both of the last two were added after the transition view exposed the planner ignoring them: it had been building after-hours sets out of 85 BPM pop records because they were calm, and opening sets with a 29% tempo jump between the first two tracks.

## Playing live

The track playing sets four constraints, and every other record can be ranked against all four at once:

**Key** — Camelot. Same key, one step round the wheel, or the swap between rings at the same number. Further than that and the two records fight. The wheel is drawn with the current key lit and the compatible ones highlighted.

**Tempo** — within about 3% is comfortable on the pitch fader, up to 6% is a stretch, past that you need a beatless intro or you cut.

**Energy** — holding or lifting a point or two keeps a floor. Dropping two or more empties it, unless you meant to.

**Intro** — how much runway the next record gives you before it has to be locked in.

Each suggestion shows all four verdicts with the actual numbers, so you can overrule it — a clashing key doesn't matter if you're cutting rather than blending.

**And when it goes wrong,** three buttons for the three things that actually happen: *floor is emptying* (Floor Savers and Resets you can mix into from here), *key is clashing* (Bridge/Tool tracks that sit under anything), *need a tempo change* (tracks that open beatless or in a different rhythmic feel). Each is filtered to what's playable from the current record — that's the difference between this and a static "bangers" folder.

## Beatgrid and cue points

The two steps every DJ does and that are easy to treat as housekeeping.

**The beatgrid** is analysis's guess at where every beat and bar falls. Sync, quantize, loops, beat-jump and every cue point snap to it. On programmed dance records the guess is right. On anything played by people — older disco, live drums, swung grooves — the real kick drifts away from a constant-tempo grid. The demo shows it on a live-played 1970s record: a chart of the grid error climbing bar by bar, and close-ups of bar 1 (kicks on the grid) against bar 32 (every kick 0.6 beats late, about 360 ms). Correct the grid and the error goes to zero; switch to a programmed record and there was never anything to fix.

The record sounds fine on its own. It only goes wrong when something trusts the grid — which is why skipping this step quietly breaks steps further down that look unrelated to it.

**Cue points** are saved positions mapped to pads on the CDJ: mix in, groove starts, breakdown, drop, and an 8-bar loop at the start of the outro that holds the record for as long as the next mix takes. Shown on a waveform coloured by section. The arrangements are illustrative — the analysis pass didn't extract song structure — but laid out the way dance records are: in multiples of 8 bars, intro and outro sized for mixing.

## The transition

The last mile, and the reason for everything above it.

Matching the beats is the easy part; sync does it. The decision that's audible is *when you start the incoming record*. Dance music is built in 32-bar phrases, and a mix sounds like one piece of music only if both records change at the same moments. The demo puts the outgoing and incoming records on two decks with their phrase lines drawn, and lets you drag the incoming start point: **on the phrase**, **half-phrase**, or **off the phrase** — technically matched, musically wrong.

It also gets a detail right that's easy to get wrong: a record with an 8-bar intro has its first phrase *after* the intro, so you press play 8 bars **before** the boundary. Starting it exactly on the boundary puts it off the phrase. Around that: the overlap in bars and seconds, where the bass swap lands, the pitch change needed to match tempo, the key relationship, and what your hands actually do at each point.

The pair comes from the set you planned upstream, opening on the pair from that set that mixes most cleanly.

## The other tools in this picture

Several tools each own a piece of this, connected by the file itself: each reads what the last wrote into its tags and adds its own.

| tool | what it's for | produces |
|---|---|---|
| **Rekordbox** (analysis) | measures tempo and key on import, places the beatgrid, draws the waveform | BPM, key, grid, waveform |
| **Mixed In Key** | dedicated key detection in Camelot notation, an energy score, cue points | key, energy, cues — written to tags |
| **Essentia** | open-source audio analysis from the Music Technology Group at Universitat Pompeu Fabra; pretrained models return probabilities for genre styles, mood, vocals | numbers, not labels |
| **crate-check** | turns those numbers into a vocabulary, checks files, plans sets, ranks what can follow | tags in standard metadata fields |
| **crate-engine** (private) | the tool behind this demo: matches want lists to files you own, adds new files safely, writes ordered playlists, reads Rekordbox's analysis from a copy | playlists for Rekordbox, match and review reports |
| **Rekordbox** (library) | where the library lives — playlists, grids, cues — and what exports to USB | everything the CDJ needs |
| **Lexicon** | keeps libraries in sync between DJ apps; bulk tag edits, duplicates, cleanup | a tidier, mirrored library |

**Where this overlaps, honestly:** Mixed In Key also gives an energy score, and Lexicon also edits tags. crate-check replaces neither — trust a dedicated key detector for key, and use Lexicon to keep libraries in sync. Key detectors disagree often on dance music, so crate-check never claims a key of its own: it reads Rekordbox's, or Mixed In Key's. It doesn't fix beatgrids, set cues, export to USB, play audio or download anything. What none of the others do is describe how a record feels or where it belongs in a night.

## Checking files

Collect a few hundred tracks at once and some are wrong. Not corrupted — *wrong*. A file named like a three-minute single that's a 47-minute festival recording.

These checks need **nothing but the metadata you already have** — no lookups, no account, no reference database — because a title makes a promise about length:

| check | rule |
|---|---|
| Set filed as a track | over 15 min, no "mix / set / live" in the title |
| Truncated file | under 90 seconds |
| Radio Edit too long | title says "Radio Edit", runs over 6 min |
| Extended too short | title says "Extended", runs under 4 min |
| Duplicate mismatch | same artist + title, lengths differ by more than 25% |

Nothing is deleted. You get a short list to listen through.

**And a note on what these can't do.** Every rule above compares a file's length against what its title promises, which means a file that is the right length and still garbage sails through all of them — six minutes of white noise, named like a record, passes every one. The Analyze stage catches it in about a second from two measurements over the actual samples. Knowing which checks are free and which need the audio is most of the work of deciding what to run.

## Export

Tags are only worth anything if they're there while you're playing, so they go into standard ID3 fields:

```
Comment   Deep House / Relaxed / Warm-up
Grouping  Warm-up
Genre     Deep House
```

Because they live in the file, they travel with it. The reliable route from a tag to the booth is a playlist: build "Peak", "Warm-up" and "Floor Savers" playlists in Rekordbox from the tags before you export, and on the CDJ they're folders you open rather than searches you hope will work.

## Running it

```bash
npm install
npm test      # 105 tests: tagging, Camelot maths, set shapes, audit, DSP, pipeline, phrasing
npm run generate # rebuild demo data, print tag coverage and every set shape's curve
npm run dev   # the tool, at localhost:3000
```

## How it's built

```
lib/library/
  types.ts           Features (what's measured) vs Tags (what you search by)
  analyze-audio.ts   FFT, spectral centroid, onset envelope, tempo
  reference.ts       the frozen cutoffs, generated from the full corpus
  tagger.ts          overlapping tags, energy, role tags
  mixing.ts          Camelot wheel, the four signals, emergency filtering
  setshapes.ts       the six shapes and the planner (energy, key, tempo band)
  phrasing.ts        bars, phrases, arrangement, cue points, transition maths
  audit.ts           self-contained file checks
  catalog.ts         the 62-track demo catalog
lib/pipeline/
  steps.ts           the fifteen steps, what each damages if skipped, the engine layer, and the cascade
app/tool/            the interface — same modules, running in the browser
```

## About the data

The demo catalog is 62 widely-known records — ABBA, Billie Jean, September, Mr. Brightside, Toxic, Take on Me, One More Time — plus recent material and enough instrumental house that the Bridge/Tool and Afterhours roles aren't empty. **BPM, duration, genre, feel, function, danceability and vocal/instrumental are the real output** of an audio-analysis pass over a 3,564-track library. Tracks whose analysis was incomplete were dropped rather than filled in.

Two honest caveats. **Camelot keys are illustrative** — that pass didn't extract key, so they're assigned here to give the harmonic-mixing views a realistic spread. And the underlying mood *floats* are reconstructed from the real tags, so the tagger genuinely re-derives them in your browser rather than reading a cached answer.

The three audio clips in the Analyze stage are synthesized — a kick loop, a pad, and white noise — so nothing here carries anyone's rights.

No personal library, listening history or playlists are published.

## Scope

crate-check starts once files exist on your disk. It doesn't fetch anything, and acquisition stays outside it — whether a download is OK depends on the rights to that recording and the terms of the service hosting it, which is a decision for you rather than something to automate.

The engine behind it is private. What's in this repo is the demo and the step map; the engine's stages are described here, not published.

## License

MIT

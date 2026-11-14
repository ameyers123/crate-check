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

## Where it fits

| | step | who |
|---|---|---|
| 1 | **Find** — decide what to look for | you |
| 2 | **Collect** — get the files | you |
| 3 | **Check** — are they what they claim? | crate-check |
| 4 | **Analyze & tag** — read the audio, label it | crate-check |
| 5 | **Plan** — shape the set beforehand | crate-check |
| 6 | **Play live** — decide what goes next | crate-check |
| 7 | **Export** — back into Rekordbox | crate-check |

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

**Thresholds are percentiles of your library, not fixed constants.** "Dark" means dark relative to what *you* own. A fixed cutoff would tag everything in a techno library and nothing in a disco one. A consequence worth knowing: the same record can tag differently in two different libraries, and that's correct.

**Every tag records why it fired.** Not `Hypnotic` but `Hypnotic — techno-family 0.61, approachability 0.14 ≤ p33, not top-quartile aggressive`. A tag you disagree with can be argued with.

## Six set shapes

A set has a job, and the job decides the curve.

| shape | curve | job |
|---|---|---|
| **Classic arc** | 3→4→6→7→8→9→9→7→5 | a full night of your own, one peak |
| **Opening set** | 3→4→4→4→5→6→6 | warm the room, never peak, hand over with somewhere left to go |
| **Peak-time** | 8→9→9→10→9→9→9 | the room is already moving, start where the last DJ left off |
| **Closing / after-hours** | 7→6→5→5→4→4→3 | take a tired room down, longer blends, fewer vocals |
| **Sunset** | 4→4→6→6→6→5 | warm and groovy, mid-tempo, nothing aggressive |
| **Festival slot** | 7→8→9→10→9 | short, daylight, land something recognisable early |

Those curves are what the planner actually produced from the demo catalog, not targets it missed.

## Playing live

The track playing sets four constraints, and every other record can be ranked against all four at once:

**Key** — Camelot. Same key, one step round the wheel, or the swap between rings at the same number. Further than that and the two records fight. The wheel is drawn with the current key lit and the compatible ones highlighted.

**Tempo** — within about 3% is comfortable on the pitch fader, up to 6% is a stretch, past that you need a beatless intro or you cut.

**Energy** — holding or lifting a point or two keeps a floor. Dropping two or more empties it, unless you meant to.

**Intro** — how much runway the next record gives you before it has to be locked in.

Each suggestion shows all four verdicts with the actual numbers, so you can overrule it — a clashing key doesn't matter if you're cutting rather than blending.

**And when it goes wrong,** three buttons for the three things that actually happen: *floor is emptying* (Floor Savers and Resets you can mix into from here), *key is clashing* (Bridge/Tool tracks that sit under anything), *need a tempo change* (tracks that open beatless or in a different rhythmic feel). Each is filtered to what's playable from the current record — that's the difference between this and a static "bangers" folder.

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

## Export

Tags are only worth anything if they're there while you're playing, so they go into standard ID3 fields:

```
Comment   Deep House / Relaxed / Warm-up
Grouping  Warm-up
Genre     Deep House
```

Because they live in the file, they're on the USB in the booth — not in an app on a laptop at home. Typing "Peak" on a CDJ and getting the tracks that work there beats scrolling filenames under pressure.

## Running it

```bash
npm install
npm test      # 40 tests: tagging rules, Camelot maths, set shapes, audit checks
npm run verify # rebuild demo data, print tag coverage and every set shape's curve
npm run dev   # the tool, at localhost:3000
```

## How it's built

```
lib/library/
  types.ts         Features (what's measured) vs Tags (what you search by)
  tagger.ts        percentile thresholds, overlapping tags, energy, role tags
  mixing.ts        Camelot wheel, the four signals, emergency filtering
  setshapes.ts     the six shapes and the planner
  audit.ts         self-contained file checks
  catalog.ts       the 43-track demo catalog
app/tool/          the interface — same modules, running in the browser
```

## About the data

The demo catalog is 43 widely-known dance records. Their **BPM is measured** and their **genre, feel and function tags are the real output** of an audio-analysis pass over a 3,000-track library — not invented.

Two honest caveats. **Camelot keys are illustrative**: that analysis pass didn't extract key, so they're assigned here to give the harmonic-mixing views a realistic spread. And the underlying feature *numbers* are reconstructed from the real tags so the tagger genuinely re-derives them live in your browser rather than reading a cached answer.

No personal library, listening history or playlists are published.

## Scope

crate-check starts once files exist on your disk. It doesn't fetch anything, and acquisition stays outside it — whether a download is OK depends on the rights to that recording and the terms of the service hosting it, which is a decision for you rather than something to automate.

## License

MIT

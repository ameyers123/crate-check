# crate-check

**Building a 470-track DJ crate for a week in the desert — and the pipeline that got it there.**

[**Walk through it →**](https://crate-check-delta.vercel.app)

---

## What this is

A case study of a real project: assembling a DJ crate for a 2026 desert event. Nine places to dig, one hard deadline, 491 candidate tracks, and a dancefloor that notices when you get it wrong.

The site walks through all six stages. This README covers the same ground.

## The six stages

### 1. Discover — nine places the music comes from

Charts say what's big. Artist radio says what sits next to a sound you already trust. Curated playlists carry a point of view. Your own saves are the only source that knows what you actually reached for.

| source | kind | tracks |
|---|---|---|
| `liked` | saved | 116 |
| `beatport_top_100_indie_dance` | chart | 96 |
| `indie_dance_2026_top_100` | chart | 84 |
| `la_french_touch` | curated | 53 |
| `damian_lazarus_radio` | artist radio | 48 |
| `jamie_xx_radio` | artist radio | 47 |
| `tinzo_jojo_groovy_sunset` | curated | 35 |
| `i_love_whatever_this_is` | curated | 22 |
| `chitiweiner_groovers` | curated | 1 |

Those add to more than 491, because a track can surface in several places at once — and that overlap turns out to be the most valuable signal in the pipeline. One algorithmic playlist recommending something is a guess. Two unrelated sources agreeing is evidence.

### 2. Reconcile — most of what you find, you already own

~1,200 raw candidates → **491 genuinely new**, after matching against the existing library.

This can't be a title match. 28 of these tracks share a title with a *different recording* — "The Future" exists as a 3:07 single and a 7:29 extended mix, and they're not interchangeable in a set. Matching on name either loses a track you wanted or quietly swaps one for another.

### 3. Prioritize — you can't dig everything

491 candidates is more than a week of listening, and a set has finite slots. The rubric scores two things: how **current** a track is, and how much **independent evidence** says it belongs.

| tier | meaning | tracks |
|---|---|---|
| P0 | 2026 release, corroborated across sources | 5 |
| P1 | 2026 release, on a dance playlist | 247 |
| P2 | 2026 release, personally saved | 25 |
| P4 | Curated playlist, 2020 or later | 104 |
| P5 | Curated playlist, back catalogue | 23 |
| P6 | Recently saved (2025–26) | 85 |
| P7 | Incidental playlist appearance | 2 |

The live demo has a budget slider: drag it to 25 tracks and only P0 survives — five records out of 491 where recency and two independent sources all agree. Everything below that line is a judgement call about how much risk the set can carry.

### 4. Acquire — the first approach failed on two thirds of the list

| attempt | recovered | lesson |
|---|---|---|
| One large batch | 172 / 464 | 63% failed — sustained traffic got throttled |
| Retry the failures, twice | 0 / 292 | Zero. Including after a four-hour wait. |
| Small paced waves | 193 / 292 | 66% recovered |

The second row is the useful one. Retrying harder and then waiting hours both recovered exactly nothing, because **the limit was how fast requests arrived, not how many had been sent**. Patience was never going to be the lever. Naming the constraint correctly was worth more than any amount of effort spent against the wrong one.

### 5. Verify — correct name, wrong recording

Files arrived tagged perfectly: right artist, right title, right remix credit. Some of them were the wrong audio — a seven-minute festival set sitting where a three-minute single should be. You find that out now, or you find it out on stage.

**The tags can't tell you.** Whatever collected the file also wrote its labels, so checking the label against the plan only proves the collector agreed with itself. The only honest check is to open the file and measure what actually came back.

What "wrong" looked like in practice:

| what arrived | caught by |
|---|---|
| A continuous festival set with the song buried inside | expected 4:51, got 11:08 |
| An acapella — vocals, no beat, unmixable | runtime, then the label |
| The extended mix when the original was planned for | 1.4× too long |
| A truncated clip that cuts off partway | expected 5:12, got 2:54 |
| A live recording — crowd noise, different arrangement | runtime looked fine; the label gave it away |

**108 files** arrived wrong this way. Verification caught all of them and they were re-collected properly. Without the check, 108 wrong recordings would be sitting in the crate right now with perfect tags — roughly one in four of everything collected.

The rules needed tuning, not guessing. An early version rejected anything whose label didn't explicitly confirm the version, which threw out *correct* files — official uploads routinely drop the remix credit from the title. The fix was a third outcome: **"nothing confirms this" is not the same as "something contradicts this."** Unconfirmed files go to a short listen-through queue (~7% of the catalogue) instead of the bin.

### 6. Crate — what ended up in the box

**470 tracks that are what they say they are.**

- **By era:** 107 from 2026, 103 from 2025, 60 from 2024, 102 from 2020–23, 119 pre-2020
- **By version:** 372 originals, 88 remixes, 31 edits/extended
- **Runtime spread:** 2:10 to 11:25, median 4:13

A crate isn't a playlist. It's raw material for a set that hasn't been planned yet, so it needs range — openers, peaks, comedowns, and tracks long enough to mix out of. The weighting toward recent years keeps a set current; the quarter that predates 2020 is what a floor already knows.

That 2:10–11:25 spread is also why the quality check can't use one percentage tolerance for everything. Five percent of an eleven-minute track is thirty-three seconds — wide enough to let an entirely different edit through.

## Three things that generalise past music

**A metric that can't go down isn't measuring anything.** One recovery pass reported 177 of 177 succeeded. It hadn't — the real number was 169. The counter measured a field the process filled in *before doing any work*, so it was structurally incapable of reporting failure. It surfaced only because a file count disagreed with it.

**Name the constraint before optimising against it.** Two full retry cycles recovered nothing because the problem looked like volume and was actually rate.

**"Unverified" and "wrong" need separate buckets.** Collapsing them forces a bad trade: trust everything and ship errors, or reject everything and bury the real failures where nobody reads them.

## Running it

```bash
npm install
npm test        # 28 tests covering the verification rules
npm run verify  # run the checks over the sample catalogue
npm run dev     # the walkthrough, at localhost:3000
```

## About the data

The **structure is real** — the nine sources, the priority tiers, the funnel counts, the throughput numbers, the outcomes. Individual **track titles and artists are generated**, so nothing here publishes a personal library. Generated ISRCs use the reserved `ZZ` country code, which is never issued, so none can collide with a real recording.

The verification step is real working code: the module the page runs in your browser is the same one the test suite covers.

**This project validates a collection; it does not acquire one.** How files get obtained sits behind an interface whose only implementation here is a stand-in.

## License

MIT

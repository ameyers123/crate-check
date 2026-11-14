# crate-check

**Your DJ library knows BPM and key. It has no idea how anything feels.**

So you can't ask it for a hypnotic track around 126, or for something to open with. crate-check analyzes each file, tags it with genre, feel and where it belongs in a night, then lets you search by that — and writes the tags back into standard ID3 fields so they show up in Rekordbox and on a CDJ.

[**Try it →**](https://crate-check-delta.vercel.app) · runs in the browser on a sample library, nothing to install

---

## The problem

Rekordbox manages your library and plays it. Lexicon cleans up metadata. Mixed In Key does key and energy. Between them you still can't answer the two questions that come up most:

- *"What should I open with?"*
- *"Give me something hypnotic around 126."*

Neither is answerable, because nothing in that stack tags **how a record feels** or **where it sits in a night**. BPM and key are measurable so everyone has them. Feel isn't, so nobody does.

## Where it fits

| | step | who does it |
|---|---|---|
| 1 | **Find** — decide what to look for | you, wherever you listen |
| 2 | **Collect** — get the files | you |
| 3 | **Check** — are they what they claim? | crate-check |
| 4 | **Analyze & tag** — read the audio, label it | crate-check |
| 5 | **Build** — search by feel, plan a set | crate-check |
| 6 | **Export** — back into Rekordbox | crate-check |

Steps 3–6 are normally split across four tools and a spreadsheet. This does them in one place and hands the result back, so you keep organising and playing where you already do.

## What it does

### Check — find files that aren't what they say they are

Collect a few hundred tracks at once and some of them are wrong. Not corrupted, *wrong*: a file named like a three-minute single that's actually a 47-minute festival recording. You find out when you load it.

These checks need **nothing but the metadata you already have** — no lookups, no account, no reference database. They work because a title makes a promise about length:

| check | rule |
|---|---|
| Set filed as a track | over 15 min with no "mix / set / live" in the title |
| Truncated file | under 90 seconds |
| Radio Edit too long | title says "Radio Edit", file runs over 6 min |
| Extended too short | title says "Extended", file runs under 4 min |
| Duplicate mismatch | same artist + title, lengths differ by more than 25% |

Nothing gets deleted. You get a short list to listen through, because the cost of a wrong file is paid later, in front of people.

### Analyze & tag — a file goes in, something searchable comes out

An audio file by itself is a filename and a waveform. The analyzer returns ~40 numbers per track (BPM, key, danceability, voice, and probabilities for every mood and genre family). The tagger turns those into words you'd actually type into a search box, in three groups:

- **Genre** — House, Deep House, Tech House, Techno, Melodic House & Techno, Tropical / Sunset House, Disco / Nu-Disco, Bass House, Breaks, Trance
- **Feel** — Party, Happy, Relaxed, Hypnotic, Aggressive, Dark, Emotional, Groovy, Euphoric
- **Function** — Vocal, Instrumental, Warm-up, Driving, Peak, Afterhours

Three things about how the tagging works:

**Tags overlap on purpose.** A track can be Tech House *and* Techno, Party *and* Hypnotic. One genre slot per track is why library tools are bad at finding a specific record — the single slot is always the wrong one for the search you're doing.

**Thresholds are percentiles of your library, not fixed constants.** "Dark" means dark relative to what *you* own. A fixed 0.7 cutoff would tag everything in a techno library and nothing in a disco one.

**Every tag records why it fired.** Not `Hypnotic` but `Hypnotic — techno-family=0.61 high, approachability=0.21 ≤ p33, not top-quartile aggressive`. A tag you disagree with can be argued with instead of just deleted.

### Build — search by feel, plan a set

Pick a feel and a BPM range, get a tracklist. That's the query that isn't possible today.

Then there's the set arc. A night has a shape — you open slower and softer, build, peak, bring it down — and the function tags map straight onto it. The tool assembles a starting order across **Warm-up → Driving → Peak → Afterhours**, shows the BPM curve, and marks which keys are harmonically compatible with the track above them so you can see where a transition will sit before you try it.

### Export — hand it back to Rekordbox

Tags are only worth anything if they're there while you're playing. They get written into standard ID3 fields:

```
Comment   Deep House / Relaxed / Warm-up
Grouping  Warm-up
Genre     Deep House
```

Nothing proprietary. Because the tags live in the file, they're on the USB stick in the booth — not in an app on a laptop at home. Typing "Peak" on a CDJ and getting the 19 tracks that work there beats scrolling 3,000 filenames under pressure.

## Running it

```bash
npm install
npm test        # 19 tests over the tagging rules and audit checks
npm run verify  # regenerate the sample library, print tag coverage
npm run dev     # the tool, at localhost:3000
```

## How it's built

```
lib/library/
  types.ts      Features (what the analyzer measures) vs Tags (what you search by)
  tagger.ts     percentile thresholds + the rules, each returning its own reason
  audit.ts      the self-contained file checks
  generate.ts   sample library generator
app/tool/       the interface — same modules, running in the browser
```

Keeping `Features` and `Tags` as separate types is what makes the tagging explainable: every tag can point back at the numbers and the threshold that produced it.

## About the data

The sample library is **generated** — invented artists and titles, with audio features shaped to match how a real house/techno collection is distributed. The tagging rules, thresholds and audit checks are the real implementation, running live in the browser. No files are uploaded and no personal library is published.

The tag vocabulary came out of running audio analysis over a real ~3,000-track library and working out which labels were actually worth having.

## Scope

crate-check starts once files exist on your disk. It doesn't fetch anything, and acquisition is deliberately outside it — whether a given download is OK depends on the rights to that specific recording and the terms of the service hosting it, which is a decision for you rather than something to automate.

## License

MIT

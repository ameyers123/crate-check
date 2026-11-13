# crate-check

**A validation engine for automated media pipelines — because the system that fetches your files also writes their metadata.**

[**Live demo →**](https://crate-check-delta.vercel.app) · [How it decides](#what-it-actually-checks) · [What it caught](#what-it-caught)

---

## The problem

I built a pipeline to acquire ~500 tracks for a DJ library from an authoritative catalog. It reported near-total success. The files had correct artist tags, correct titles, correct ISRCs.

A sample listen found a 7-minute DJ-set recording sitting where a 3:25 single should be. Correct artist. Correct title. Correct remix credit. Wrong audio.

The reason that got through is the part worth generalizing:

> **The component that fetches the file is usually the same component that writes the file's metadata.** So validating metadata against the catalog is circular. It proves the fetcher was internally consistent. It says nothing about whether the bytes are right.

Any pipeline where an acquirer labels its own output has this hole: ETL jobs that stamp their own provenance, scrapers that record their own source URLs, ingestion services that tag their own payloads. The check feels like verification and is actually a tautology.

## The approach

Validate only on signals the fetcher **cannot author**:

1. **The measured artifact** — decode the file and measure it. The fetcher can claim a runtime; it cannot make a 7-minute file be 3 minutes long.
2. **Independent provenance** — what the *source* called this thing, retrieved separately from the fetch.

And return **three** outcomes, not two:

| | meaning | disposition |
|---|---|---|
| `PASS` | corroborated | goes to the library |
| `REVIEW` | *unconfirmed* — nothing proved it right, nothing proved it wrong | short human queue |
| `FAIL` | *contradicted* — a signal actively disagrees | quarantined with a reason |

Binary pass/fail forces a bad trade. Treat "unconfirmed" as pass and unchecked files enter the library. Treat it as fail and good files get buried in a reject pile nobody reads, which means nobody reads the real failures either. The middle bucket is what makes the strict rules affordable — it stayed at 7% of the catalog, small enough to actually work through.

## What it actually checks

```
measured duration outside catalog window ──────────────→ FAIL (duration)
source title carries a disqualifying token ────────────→ FAIL (version)
   live · acapella · cover · karaoke · sped up · nightcore · instrumental
source title announces a competing version ────────────→ FAIL (version)
source title confirms the expected version ────────────→ PASS
source title is silent, runtime near-exact ────────────→ REVIEW
no source title at all, plain original expected ───────→ PASS  (runtime suffices)
no source title at all, specific version expected ─────→ REVIEW
```

The duration gate runs first and catches most version errors incidentally — an "Extended Mix" standing in for an original is usually also 40% too long. The title rules are the second line, not a redundant one. In the demo you can widen the tolerance to absurdity and watch duration failures convert into version failures rather than disappear.

## What it caught

Across 491 tracks in the real run, **108 files had correct metadata and wrong audio**:

| what the tags said | what the file was | how it was caught |
|---|---|---|
| 3:25 single, correct remix credit | 7:04 DJ-set segment | 2.1× runtime |
| studio track, 8:23 | 10:00 **acapella** — no beat at all | 1.2× runtime |
| original mix | "Extended Mix", 1.5× long | runtime + title |
| 3:07 track | 2:01 truncated upload | 0.65× runtime |
| original | "(Live at …)" | disqualifying token |

Not one of these is detectable by comparing tags to the catalog. Every one is obvious the moment you measure the file.

## Two false positives worth keeping

Both of these shipped as bugs. Both are now switches in the demo — **turn them off and watch correct files get rejected in real time**.

**1. "Original Mix" is a synonym, not a conflict.** In dance-music convention `Original Mix` *is* the unremixed release. Scanning naively for the token `mix` flagged correctly-matched originals as version conflicts. Flipping this switch off in the demo turns 9 correct files red.

**2. Unconfirmed is not contradicted.** For a remix whose source title never names the remixer, the first rule said FAIL. But official uploads routinely omit remix credits from the title, and several of these files matched the catalog runtime *to the second*. Absence of proof isn't disproof: when the runtime is near-exact and nothing contradicts it, that's a REVIEW. This one mattered — it was the difference between a reviewable queue and silently discarding correct files.

The pattern in both: the rules were wrong in the direction of **over-rejecting**, and I only found out by reading verdicts against the actual audio. Both are pinned as regression tests in [`tests/validate.test.ts`](tests/validate.test.ts).

## The metric that lied

Worth its own section, because it's the mistake I'd most want to not repeat.

A recovery pass reported **177/177 succeeded**. It had not. The real number was 169/177.

The counter measured success as *"does this record have a `download_url`?"* — but that run worked by **pre-assigning** `download_url` to every record by design. The field was populated before any work happened. The metric was structurally incapable of returning anything but 100%.

It was only caught because the file count didn't match the success count. The fix was to measure something the process couldn't pre-populate: entries appended to a completion log, which only grows on an actual write.

A success metric that cannot report failure is not a success metric. If a number can't go down, it isn't measuring anything.

## Results

| | |
|---|---|
| Tracks targeted | 491 |
| Validated into the library | 470 |
| Wrong-audio files caught and quarantined | 108 |
| Held for human review | 7% of catalog |
| Unobtainable from any source | 6 |

Throughput was a separate problem with a separate lesson. Bulk retries against a rate-limited source returned **0 of 292** twice in a row, including after a four-hour cooldown. Restructuring into small paced batches instead of one large run recovered **193 of 292 (66%)** — the constraint was request *rate*, not total volume, and more waiting was never going to fix it.

## Run it

```bash
npm install
npm test          # 28 tests, including both false-positive regressions
npm run verify    # validate the synthetic catalog, print the report
npm run dev       # interactive playground at localhost:3000
```

Useful CLI flags:

```bash
npm run verify -- --tolerance 20              # widen the duration window
npm run verify -- --no-original-mix-synonym   # reproduce false positive #1
npm run verify -- --no-near-exact-downgrade   # reproduce false positive #2
npm run verify -- --list FAIL                 # show every rejection and why
```

## Architecture

```
lib/engine/        pure validation — no I/O, no dependencies beyond types
  validate.ts        validateTrack(expected, actual, config) -> Verdict
  vocab.ts           the controlled vocabularies
  similarity.ts      small fuzzy matcher (REVIEW/FAIL boundary only, never PASS)
lib/adapters/      the ingestion boundary
  source-adapter.ts  interface SourceAdapter { find(track) -> Candidate | null }
  mock-adapter.ts    the only implementation shipped here
lib/data/          synthetic catalog generator + committed output
cli/verify.ts      CLI report
app/               the playground — runs the same engine, in the browser
```

The engine is pure functions. The CLI and the web playground import the *same* module, so the demo isn't a reimplementation that can drift from the real rules — toggling a switch on the page runs the code the tests pin.

## Scope

**crate-check validates; it does not acquire.** Ingestion lives behind a `SourceAdapter` interface and the only implementation in this repository is a deterministic mock. Nothing here downloads anything.

All catalog data is **synthetic** — artists, titles and ISRCs are generated from word banks, and the ISRCs use the reserved `ZZ` country code, which is never issued, so no generated identifier can collide with a real recording. The demo reproduces the real failure taxonomy; it does not contain real catalog data.

The outcome figures above are from the private run this tool was built for. The numbers in the live demo come from the synthetic catalog and will differ.

## License

MIT

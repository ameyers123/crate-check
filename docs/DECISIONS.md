# Decisions

Short records of the calls that shaped the engine, and what each one cost.

---

## 1. Validate the artifact, not the metadata

**Context.** The acquirer wrote the files' tags from the same catalog the validator would check against.

**Decision.** Never gate on metadata. Gate on the decoded artifact and on provenance retrieved independently of the fetch.

**Why.** Tag-vs-catalog comparison is circular — it can only ever confirm the fetcher agreed with itself. It would have passed all 108 bad files.

**Cost.** Decoding every file is slower than reading tags, and provenance lookups are a second network dependency that fails sometimes. The `REVIEW_NO_PROVENANCE` path exists specifically to absorb those failures without either trusting or discarding the file.

---

## 2. Three outcomes, not two

**Decision.** `PASS` / `REVIEW` / `FAIL`, where REVIEW means "nothing confirmed this and nothing contradicted it."

**Why.** With a binary verdict, every rule change trades false accepts against false rejects on a single axis. Strict rules bury good files; loose rules admit bad ones. The middle bucket decouples them: rules can be strict about *contradiction* while staying honest about *uncertainty*.

**Cost.** A queue a human has to actually work. Only worth it while it stays small — it ran at ~7% of the catalog. If REVIEW had grown past roughly 15% it would have become a pile nobody reads, which is the same as discarding it, and the rules would have needed retuning instead.

---

## 3. Duration window from the catalog, not a global constant

**Decision.** Each track carries its own accepted window (expected ± tolerance) rather than a single global percentage.

**Why.** A ±8s absolute window behaves correctly across a catalog spanning 2:45 to 11:00. A percentage tolerance is far too loose on long tracks — 5% of an 11-minute track is 33 seconds, which comfortably admits a different edit.

**Cost.** Needs a trustworthy per-track duration in the catalog. Without one this whole approach collapses, since the measured duration has nothing to be measured against.

---

## 4. Fuzzy matching decides REVIEW vs FAIL — never PASS

**Decision.** Approximate string matching can downgrade a rejection to a review. It can never promote something to passing.

**Why.** Fuzzy scores are the easiest place to accidentally launder a wrong file into the library. Keeping them on the reject side of the boundary means a bad threshold produces extra review work, not silent corruption.

**Cost.** Some genuinely correct files land in REVIEW that a more trusting matcher would have passed. That's the intended direction to be wrong in.

---

## 5. Both false-positive fixes are switches, not silent patches

**Decision.** `originalMixSynonym` and `nearExactDowngrade` are config flags, exposed in the demo UI and pinned by tests.

**Why.** Two reasons. Testing: each one has a regression test that fails if the fix regresses. Communication: a reviewer can turn them off and watch 16 correct files turn red, which argues for the rules better than a paragraph does.

**Cost.** More surface area in `RuleConfig` than a hardcoded fix would need.

---

## 6. Ingestion behind an interface

**Decision.** `SourceAdapter` is the boundary; the only shipped implementation is a mock.

**Why.** Partly scope — how files are acquired is orthogonal to whether they're correct, and this repository is about the second question. Partly testability: the interesting failure modes are rare in the wild and trivial to construct against a mock. The 11-case taxonomy in the generator would take weeks to collect naturally.

**Cost.** The demo can't show real-world match rates, only the engine's behaviour on a distribution I chose.

---

## 7. Measure completions, not intentions

**Decision.** Count work as done only when it produces an artifact the process cannot fabricate in advance.

**Why.** A recovery run reported 177/177 by counting a field it pre-populated by design. The number could not go down. Counting appends to a completion log instead gave 169/177 — the truth, and a list of 8 to retry.

**Cost.** Slightly more bookkeeping. Nothing compared to acting on a metric that can't fail.

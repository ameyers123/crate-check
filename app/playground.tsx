"use client";

import { useMemo, useState } from "react";
import { DEFAULT_RULES, tally, validateAll } from "@/lib/engine";
import type { RuleConfig, ValidatedPairing, VerdictStatus } from "@/lib/engine";
import type { CatalogEntry, Scenario } from "@/lib/data/generate-catalog";

const SCENARIO_LABEL: Record<Scenario, string> = {
  clean: "correct match",
  original_mix_label: "labelled “Original Mix”",
  dj_set_rip: "DJ-set rip",
  acapella: "acapella",
  extended_for_original: "extended mix substituted",
  snippet: "truncated snippet",
  live_cut: "live recording",
  unnamed_remixer_exact: "remixer unnamed, runtime exact",
  fuzzy_remixer: "remixer misspelled",
  no_provenance: "no source title",
  missing: "nothing returned",
};

const STATUS_STYLE: Record<VerdictStatus, string> = {
  PASS: "text-pass border-pass/30 bg-pass/10",
  REVIEW: "text-review border-review/30 bg-review/10",
  FAIL: "text-fail border-fail/30 bg-fail/10",
};

function Toggle({
  label,
  hint,
  checked,
  onChange,
  highlight = false,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
        highlight
          ? checked
            ? "border-accent/40 bg-accent/10"
            : "border-fail/40 bg-fail/10"
          : checked
            ? "border-edge bg-panel2"
            : "border-edge/60 bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`text-sm font-medium ${checked ? "" : "text-muted"}`}>{label}</span>
        <span
          className={`shrink-0 h-5 w-9 rounded-full p-0.5 transition-colors ${
            checked ? (highlight ? "bg-accent" : "bg-foreground/70") : "bg-edge"
          }`}
        >
          <span
            className={`block h-4 w-4 rounded-full bg-background transition-transform ${
              checked ? "translate-x-4" : ""
            }`}
          />
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>
    </button>
  );
}

function Stat({
  label,
  n,
  total,
  delta,
  tone,
}: {
  label: VerdictStatus;
  n: number;
  total: number;
  delta: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-edge bg-panel/70 p-4">
      <div className="flex items-baseline justify-between">
        <span className={`text-xs font-semibold tracking-widest ${tone}`}>{label}</span>
        {delta !== 0 && (
          <span
            className={`font-mono text-xs ${delta > 0 ? "text-fail" : "text-pass"}`}
            title="change vs. the default rule set"
          >
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </div>
      <div className="mt-1 font-mono text-3xl">{n}</div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-edge">
        <div
          className={`h-full rounded-full ${
            label === "PASS" ? "bg-pass" : label === "REVIEW" ? "bg-review" : "bg-fail"
          }`}
          style={{ width: `${total ? (n / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

export default function Playground({ entries }: { entries: CatalogEntry[] }) {
  const [config, setConfig] = useState<RuleConfig>(DEFAULT_RULES);
  const [filter, setFilter] = useState<VerdictStatus | "ALL">("ALL");

  const pairings = useMemo(
    () => entries.map((e) => ({ track: e.track, candidate: e.candidate })),
    [entries],
  );
  const scenarioById = useMemo(
    () => new Map(entries.map((e) => [e.track.id, e.scenario])),
    [entries],
  );

  const results = useMemo(() => validateAll(pairings, config), [pairings, config]);
  const baseline = useMemo(() => tally(validateAll(pairings, DEFAULT_RULES)), [pairings]);
  const counts = useMemo(() => tally(results), [results]);

  const shown = useMemo(
    () => (filter === "ALL" ? results : results.filter((r) => r.verdict.status === filter)),
    [results, filter],
  );

  const set = <K extends keyof RuleConfig>(k: K, v: RuleConfig[K]) =>
    setConfig((c) => ({ ...c, [k]: v }));
  const isDefault = JSON.stringify(config) === JSON.stringify(DEFAULT_RULES);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold tracking-tight">crate-check</h1>
          <span className="rounded-full border border-edge bg-panel px-2.5 py-0.5 text-xs text-muted">
            interactive demo · synthetic data
          </span>
        </div>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-foreground/80">
          A pipeline that fetches a file usually writes that file&rsquo;s metadata too. So
          checking metadata against the catalog is circular — it proves the fetcher was
          consistent with itself, not that the audio is right. This engine only trusts
          signals the fetcher cannot author: the{" "}
          <span className="text-accent">measured duration of the artifact</span> and the{" "}
          <span className="text-accent">title published by the source</span>.
        </p>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted">
          Every track below is fictional. Turn the rules off and watch correct files get
          rejected — both highlighted switches exist because the rule set shipped without
          them first and produced false positives.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-edge bg-panel/70 p-4">
            <div className="flex items-baseline justify-between">
              <label htmlFor="tol" className="text-sm font-medium">
                Duration tolerance
              </label>
              <span className="font-mono text-sm text-accent">±{config.toleranceS}s</span>
            </div>
            <input
              id="tol"
              type="range"
              min={0}
              max={60}
              value={config.toleranceS}
              onChange={(e) => set("toleranceS", Number(e.target.value))}
              className="mt-3 w-full"
            />
            <p className="mt-2 text-xs leading-relaxed text-muted">
              How far the measured file may drift from the catalog runtime. Push it wide and
              duration failures convert into version failures — the title rules are the
              second line of defence, not a redundant one.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="px-1 text-xs font-semibold tracking-widest text-muted">RULES</h2>
            <Toggle
              label="Duration gate"
              hint="Measure the artifact and compare against the catalog runtime."
              checked={config.durationGate}
              onChange={(v) => set("durationGate", v)}
            />
            <Toggle
              label="Disqualifying tokens"
              hint="Reject live cuts, acapellas, covers, sped-up edits outright."
              checked={config.disqualifyingTokens}
              onChange={(v) => set("disqualifyingTokens", v)}
            />
            <Toggle
              label="Version rules"
              hint="Match remix credits and edit/extended labels against the catalog."
              checked={config.versionRules}
              onChange={(v) => set("versionRules", v)}
            />
          </div>

          <div className="space-y-2">
            <h2 className="px-1 text-xs font-semibold tracking-widest text-muted">
              REFINEMENTS — FROM REAL FALSE POSITIVES
            </h2>
            <Toggle
              highlight
              label="“Original Mix” is a synonym"
              hint="In dance releases “Original Mix” labels the unremixed track. Scanning naively for “mix” rejected correct files."
              checked={config.originalMixSynonym}
              onChange={(v) => set("originalMixSynonym", v)}
            />
            <Toggle
              highlight
              label="Near-exact runtime downgrades FAIL → REVIEW"
              hint="Official uploads often omit the remix credit. An exact runtime is corroboration; absence of proof is not disproof."
              checked={config.nearExactDowngrade}
              onChange={(v) => set("nearExactDowngrade", v)}
            />
          </div>

          <button
            onClick={() => setConfig(DEFAULT_RULES)}
            disabled={isDefault}
            className="w-full rounded-lg border border-edge px-3 py-2 text-sm transition-colors enabled:hover:bg-panel2 disabled:opacity-40"
          >
            Reset to shipped defaults
          </button>
        </aside>

        <main className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="PASS" n={counts.PASS} total={counts.total} delta={counts.PASS - baseline.PASS} tone="text-pass" />
            <Stat label="REVIEW" n={counts.REVIEW} total={counts.total} delta={counts.REVIEW - baseline.REVIEW} tone="text-review" />
            <Stat label="FAIL" n={counts.FAIL} total={counts.total} delta={counts.FAIL - baseline.FAIL} tone="text-fail" />
          </div>

          {!isDefault && (
            <p className="rounded-lg border border-review/30 bg-review/10 px-3 py-2 text-xs text-review">
              Rules differ from the shipped defaults — deltas above are measured against them.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {(["ALL", "PASS", "REVIEW", "FAIL"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  filter === f ? "border-foreground/40 bg-panel2" : "border-edge text-muted hover:text-foreground"
                }`}
              >
                {f}
                <span className="ml-1.5 font-mono opacity-60">
                  {f === "ALL" ? counts.total : counts[f]}
                </span>
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-edge">
            <table className="w-full text-left text-sm">
              <thead className="bg-panel text-xs tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Track</th>
                  <th className="px-4 py-3 font-medium">Runtime</th>
                  <th className="px-4 py-3 font-medium">Verdict</th>
                  <th className="px-4 py-3 font-medium">Why</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r: ValidatedPairing) => {
                  const measured = r.candidate?.measuredDurationS ?? null;
                  const drift = measured !== null ? measured / r.track.expectedDurationS : null;
                  return (
                    <tr key={r.track.id} className="border-t border-edge/70 align-top">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.track.title}</div>
                        <div className="text-xs text-muted">{r.track.artist}</div>
                        <div className="mt-1 inline-block rounded border border-edge px-1.5 py-0.5 text-[10px] text-muted">
                          {SCENARIO_LABEL[scenarioById.get(r.track.id)!]}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                        <div className="text-muted">want {r.track.expectedDurationS}s</div>
                        <div className={drift && (drift > 1.15 || drift < 0.9) ? "text-fail" : ""}>
                          got {measured === null ? "—" : `${measured}s`}
                          {drift && (drift > 1.15 || drift < 0.9) ? ` (${drift.toFixed(2)}×)` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.verdict.status]}`}
                        >
                          {r.verdict.status}
                        </span>
                        <div className="mt-1 font-mono text-[10px] text-muted">
                          {r.verdict.code}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs leading-relaxed text-foreground/75">
                        {r.verdict.reasons.join(" · ")}
                        {r.candidate?.title ? (
                          <div className="mt-1 text-muted">
                            source title:{" "}
                            <span className="font-mono">“{r.candidate.title}”</span>
                          </div>
                        ) : (
                          <div className="mt-1 text-muted">source title: —</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      <footer className="mt-12 border-t border-edge pt-6 text-xs leading-relaxed text-muted">
        <p>
          crate-check validates; it does not acquire. Ingestion sits behind a{" "}
          <span className="font-mono">SourceAdapter</span> interface and the only
          implementation in this repository is a deterministic mock. All catalog data on
          this page is generated — ISRCs use the reserved{" "}
          <span className="font-mono">ZZ</span> country code and match no real recording.
        </p>
      </footer>
    </div>
  );
}

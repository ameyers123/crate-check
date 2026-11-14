"use client";

import { useMemo, useState } from "react";
import { PRESETS, STEPS, STEP_BY_ID, evaluate } from "@/lib/pipeline/steps";
import type { Severity, Step, StepId, StepState } from "@/lib/pipeline/steps";

const LEVEL_STYLE: Record<Step["level"], string> = {
  required: "border-foreground/35 text-foreground/90",
  recommended: "border-accent/45 text-accent",
  optional: "border-edge text-muted",
};

const SEVERITY_STYLE: Record<Severity, { text: string; label: string }> = {
  blocking: { text: "text-fail", label: "can't happen" },
  severe: { text: "text-fail", label: "goes wrong" },
  annoying: { text: "text-review", label: "slower, riskier" },
};

const ROLE_LABEL: Record<Step["crateCheck"], string> = {
  "does it": "crate-check does this",
  helps: "crate-check helps",
  no: "outside crate-check",
};

function nodeStyle(state: StepState): string {
  switch (state.status) {
    case "skipped":
      return "border-dashed border-edge bg-transparent text-muted line-through";
    case "blocked":
      return "border-fail bg-fail/20 text-fail";
    case "degraded":
      return state.hitBy.some((c) => c.severity !== "annoying")
        ? "border-fail/70 bg-fail/10 text-fail"
        : "border-review/70 bg-review/10 text-review";
    default:
      return "border-foreground/25 bg-panel text-foreground";
  }
}

function Detail({
  step,
  state,
  skipped,
  onToggle,
}: {
  step: Step;
  state: StepState;
  skipped: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-edge bg-panel/70 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] text-muted">{String(step.n).padStart(2, "0")}</span>
        <h3 className="text-[17px] font-medium">{step.name}</h3>
        <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${LEVEL_STYLE[step.level]}`}>
          {step.level}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-[88px_1fr] gap-x-3 gap-y-2 text-[13px]">
        <dt className="text-muted">Who</dt>
        <dd>{step.who}</dd>
        <dt className="text-muted">Time</dt>
        <dd>{step.time}</dd>
        <dt className="text-muted">This tool</dt>
        <dd className={step.crateCheck === "no" ? "text-muted" : "text-accent"}>
          {ROLE_LABEL[step.crateCheck]}
        </dd>
      </dl>

      <p className="mt-4 text-[14px] leading-relaxed text-foreground/85">{step.does}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">{step.why}</p>

      <div className="mt-5 border-t border-edge/70 pt-4">
        <h4 className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">If you skip it</h4>
        <p className="mt-2 text-[13px] text-foreground/80">{step.skipNote}</p>
        {step.ifSkipped.length > 0 && (
          <ul className="mt-3 space-y-2.5">
            {step.ifSkipped.map((c) => (
              <li key={c.hits} className="text-[13px] leading-relaxed">
                <span className={`font-medium ${SEVERITY_STYLE[c.severity].text}`}>
                  {STEP_BY_ID[c.hits].name} {SEVERITY_STYLE[c.severity].label}
                </span>
                <span className="text-muted"> — {c.what}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {state.hitBy.length > 0 && (
        <div className="mt-4 rounded-lg border border-fail/25 bg-fail/[0.06] p-3">
          <h4 className="font-mono text-[11px] tracking-[0.16em] text-fail uppercase">
            Right now, because of what you skipped
          </h4>
          <ul className="mt-2 space-y-1.5">
            {state.hitBy.map((c, i) => (
              <li key={i} className="text-[13px] leading-relaxed text-foreground/80">
                <span className="text-muted">from {STEP_BY_ID[c.from].name}:</span> {c.what}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={onToggle}
          className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
            skipped
              ? "border-fail/50 bg-fail/15 text-fail"
              : "border-edge hover:border-fail/40 hover:text-fail"
          }`}
        >
          {skipped ? "Un-skip this step" : "Skip this step"}
        </button>
        <a
          href={`#${step.anchor}`}
          className="rounded-lg border border-edge px-3 py-1.5 text-[13px] text-muted transition-colors hover:text-foreground"
        >
          Go to this step ↓
        </a>
      </div>
    </div>
  );
}

export default function Pipeline() {
  const [skipped, setSkipped] = useState<Set<StepId>>(new Set());
  const [selected, setSelected] = useState<StepId>("beatgrid");

  const ev = useMemo(() => evaluate(skipped), [skipped]);

  const toggle = (id: StepId) =>
    setSkipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const phases = ["Get the music", "Prepare it", "Play it"] as const;
  const sel = STEP_BY_ID[selected];

  const summary =
    ev.skippedCount === 0
      ? "Nothing skipped. Every step does its job."
      : [
          `Skipping ${ev.skippedCount} step${ev.skippedCount === 1 ? "" : "s"}`,
          ev.blockedCount ? `${ev.blockedCount} can't happen` : null,
          ev.degradedCount ? `${ev.degradedCount} degraded` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  const outcomeStyle =
    ev.outcome.tone === "good"
      ? "border-pass/35 bg-pass/[0.08] text-pass"
      : ev.outcome.tone === "ok"
        ? "border-review/35 bg-review/[0.08] text-review"
        : "border-fail/35 bg-fail/[0.08] text-fail";

  return (
    <section id="pipeline" className="scroll-mt-4 border-y border-edge/60 bg-panel/25 py-12">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            From hearing a record to mixing it on a CDJ
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground/80">
            Eleven steps. Some are required, some are worth the time, some are optional —
            including one this tool does. Click a step to see what it involves. Skip it to
            see what breaks further down.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[12px] text-muted">Try:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setSkipped(new Set(p.skip))}
              className="rounded-full border border-edge px-3 py-1 text-[12px] text-muted transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {p.label}
            </button>
          ))}
          {skipped.size > 0 && (
            <button
              onClick={() => setSkipped(new Set())}
              className="rounded-full border border-edge px-3 py-1 text-[12px] text-muted transition-colors hover:text-foreground"
            >
              Reset
            </button>
          )}
          <span className="ml-auto font-mono text-[12px] text-muted">{summary}</span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* min-w-0: a grid item won't shrink below its longest no-wrap line otherwise */}
          <div className="min-w-0 space-y-6">
            {phases.map((phase) => (
              <div key={phase}>
                <h3 className="mb-2.5 font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
                  {phase}
                </h3>
                <ol className="space-y-1.5">
                  {STEPS.filter((s) => s.phase === phase).map((s) => {
                    const st = ev.states[s.id];
                    const isSel = s.id === selected;
                    return (
                      <li key={s.id}>
                        <div
                          className={`rounded-xl border transition-colors ${
                            isSel ? "border-foreground/40 bg-panel" : "border-edge/70 bg-panel/40 hover:border-edge"
                          }`}
                        >
                          <div className="flex items-center gap-3 p-3">
                            <button
                              onClick={() => setSelected(s.id)}
                              className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] ${nodeStyle(st)}`}
                              >
                                {s.n}
                              </span>
                              <span className="min-w-0">
                                <span
                                  className={`block text-[14px] font-medium ${
                                    st.status === "skipped" ? "text-muted line-through" : ""
                                  }`}
                                >
                                  {s.name}
                                </span>
                                <span className="block truncate text-[12px] text-muted">
                                  {s.sub} · {s.who}
                                </span>
                              </span>
                            </button>
                            <span
                              className={`hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide sm:inline ${LEVEL_STYLE[s.level]}`}
                            >
                              {s.level}
                            </span>
                            <button
                              onClick={() => toggle(s.id)}
                              aria-pressed={skipped.has(s.id)}
                              className={`shrink-0 rounded-md border px-2 py-1 text-[11px] transition-colors ${
                                skipped.has(s.id)
                                  ? "border-fail/50 bg-fail/15 text-fail"
                                  : "border-edge text-muted hover:border-fail/40 hover:text-fail"
                              }`}
                            >
                              {skipped.has(s.id) ? "skipped" : "skip"}
                            </button>
                          </div>

                          {/* A skipped step's own damage is moot — you didn't do it. */}
                          {st.hitBy.length > 0 && st.status !== "skipped" && (
                            <div className="space-y-1 border-t border-edge/60 px-3 py-2">
                              {st.hitBy.map((c, i) => (
                                <p key={i} className="text-[12px] leading-snug">
                                  <span className={SEVERITY_STYLE[c.severity].text}>
                                    {st.status === "blocked" && c.severity === "blocking"
                                      ? "Can't happen"
                                      : SEVERITY_STYLE[c.severity].label}
                                  </span>
                                  <span className="text-muted">
                                    {" "}
                                    — {c.what}{" "}
                                    <span className="whitespace-nowrap opacity-70">
                                      (skipped {STEP_BY_ID[c.from].name})
                                    </span>
                                  </span>
                                </p>
                              ))}
                            </div>
                          )}

                          {isSel && (
                            <div className="border-t border-edge/60 p-3 lg:hidden">
                              <Detail
                                step={s}
                                state={st}
                                skipped={skipped.has(s.id)}
                                onToggle={() => toggle(s.id)}
                              />
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}

            <div className={`rounded-xl border px-4 py-3 text-[14px] ${outcomeStyle}`}>
              <span className="font-mono text-[11px] tracking-[0.16em] uppercase opacity-80">
                Where you end up ·{" "}
              </span>
              {ev.outcome.text}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-4">
              <Detail
                step={sel}
                state={ev.states[selected]}
                skipped={skipped.has(selected)}
                onToggle={() => toggle(selected)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { PRIORITY_BANDS } from "@/lib/data/pipeline";
import { Bar, Callout, Section } from "./ui";

const TOTAL = PRIORITY_BANDS.reduce((s, b) => s + b.tracks, 0);

export default function Prioritize() {
  const [budget, setBudget] = useState(TOTAL);

  // Tiers fill in rank order — P0 first — until the budget runs out.
  let remaining = budget;
  const rows = PRIORITY_BANDS.map((band) => {
    const taken = Math.max(0, Math.min(band.tracks, remaining));
    remaining -= taken;
    return { ...band, taken };
  });
  const dropped = TOTAL - budget;

  return (
    <Section
      n={3}
      kicker="Prioritize"
      title="You can't dig everything, so what makes the set?"
      lede={
        <>
          491 candidates is more than a week of listening. Every track costs time to collect
          and time to audition, and a set has finite slots. The rubric scores on two things:
          how <em>current</em> a track is, and how much <em>independent evidence</em> says it
          belongs.
        </>
      }
    >
      <div className="rounded-xl border border-edge bg-panel/60 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor="budget" className="text-sm font-medium">
            If you only had time for&hellip;
          </label>
          <span className="font-mono text-sm text-accent">{budget} tracks</span>
        </div>
        <input
          id="budget"
          type="range"
          min={25}
          max={TOTAL}
          step={1}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="mt-4 w-full"
        />
        <p className="mt-2.5 text-[13px] text-muted">
          {dropped === 0
            ? "Everything makes it. Drag left to see what gets cut first."
            : `${dropped} tracks cut — the rubric gives up the weakest evidence first.`}
        </p>
      </div>

      <div className="mt-5 space-y-2.5">
        {rows.map((b) => {
          const partial = b.taken > 0 && b.taken < b.tracks;
          const out = b.taken === 0;
          return (
            <div
              key={b.id}
              className={`rounded-xl border p-4 transition-opacity ${
                out ? "border-edge/50 opacity-40" : "border-edge bg-panel/60"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div className="flex items-baseline gap-2.5">
                  <span
                    className={`font-mono text-xs ${
                      out ? "text-muted" : partial ? "text-review" : "text-accent"
                    }`}
                  >
                    {b.id}
                  </span>
                  <span className="text-[15px]">{b.label}</span>
                </div>
                <span className="font-mono text-xs text-muted">
                  {b.taken < b.tracks ? (
                    <>
                      <span className={out ? "" : "text-review"}>{b.taken}</span>
                      <span className="opacity-50"> / {b.tracks}</span>
                    </>
                  ) : (
                    b.tracks
                  )}
                </span>
              </div>
              <div className="mt-2.5">
                <Bar
                  value={b.taken}
                  max={Math.max(...PRIORITY_BANDS.map((x) => x.tracks))}
                  tone={out ? "muted" : partial ? "accent" : "pass"}
                />
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{b.rationale}</p>
            </div>
          );
        })}
      </div>

      <Callout>
        Pull the slider down to 25 and only one thing survives:{" "}
        <strong className="text-foreground">tracks that are both new and corroborated.</strong>{" "}
        That&rsquo;s five records out of 491. It reads as a harsh cut, but it&rsquo;s the
        honest one — those are the only tracks where two independent sources and recency all
        agree. Everything below it is a judgement call about how much risk the set can carry.
      </Callout>
    </Section>
  );
}

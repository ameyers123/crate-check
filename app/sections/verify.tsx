"use client";

import { useMemo, useState } from "react";
import { validateTrack, DEFAULT_RULES } from "@/lib/engine";
import type { CatalogEntry } from "@/lib/data/generate-catalog";
import { OUTCOMES } from "@/lib/data/pipeline";
import { Callout, Section } from "./ui";

/** Plain-language name for each way a file turned out to be the wrong one. */
const FAILURE_COPY: Record<string, { headline: string; detail: string }> = {
  dj_set_rip: {
    headline: "A festival set, not the single",
    detail: "Tagged as the track. Actually a continuous mix recording with the song somewhere inside it.",
  },
  acapella: {
    headline: "Vocals only, no beat",
    detail: "An acapella upload. Unmixable — it would die the moment it came in.",
  },
  extended_for_original: {
    headline: "The extended mix, not the original",
    detail: "A different arrangement with a long intro. Fine if you wanted it; wrong if you planned around the original.",
  },
  snippet: {
    headline: "A clip, not the track",
    detail: "A truncated upload that cuts off partway through.",
  },
  live_cut: {
    headline: "A live recording",
    detail: "Crowd noise, different arrangement, different length.",
  },
};

/** Did runtime alone give this away, or did it take reading the label? */
function offByRuntime(expected: number, got: number) {
  return Math.abs(got - expected) > 10;
}

export default function Verify({ entries }: { entries: CatalogEntry[] }) {
  const [checking, setChecking] = useState(true);

  // Real engine, real rules — run over the sample catalogue to produce examples.
  const examples = useMemo(() => {
    const seen = new Set<string>();
    const out: { entry: CatalogEntry; reason: string }[] = [];
    for (const e of entries) {
      if (!FAILURE_COPY[e.scenario] || seen.has(e.scenario)) continue;
      const v = validateTrack(e.track, e.candidate, DEFAULT_RULES);
      if (v.status !== "FAIL") continue;
      seen.add(e.scenario);
      out.push({ entry: e, reason: v.reasons[0] });
    }
    return out;
  }, [entries]);

  const wrong = OUTCOMES.wrongRecordingCaught;

  return (
    <Section
      n={5}
      kicker="Verify"
      title="Correct name. Wrong recording."
      lede={
        <>
          Files arrived tagged perfectly — right artist, right title, right remix credit.
          Some of them were the wrong audio: a seven-minute festival set sitting where a
          three-minute single should be. You find that out now, or you find it out on stage.
        </>
      }
    >
      <p className="-mt-3 mb-8 max-w-2xl text-[15px] leading-relaxed text-foreground/70">
        The catch is that the tags can&rsquo;t tell you. Whatever collected the file also
        wrote its labels, so checking the label against the plan only proves the collector
        agreed with itself. The only honest check is to open the file and measure what
        actually came back.
      </p>

      <div className="rounded-xl border border-edge bg-panel/60 p-5">
        <button
          onClick={() => setChecking((c) => !c)}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <span>
            <span className="text-[15px] font-medium">Open and measure every file</span>
            <span className="mt-0.5 block text-[13px] text-muted">
              Toggle this off to see the crate you&rsquo;d have without the check.
            </span>
          </span>
          <span
            className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${
              checking ? "bg-accent" : "bg-fail/70"
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-background transition-transform ${
                checking ? "translate-x-5" : ""
              }`}
            />
          </span>
        </button>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-edge/70 pt-5">
          <div>
            <div className="font-mono text-3xl">{OUTCOMES.playable}</div>
            <div className="mt-1 text-xs text-muted">tracks in the crate</div>
          </div>
          <div>
            <div className={`font-mono text-3xl ${checking ? "text-pass" : "text-fail"}`}>
              {checking ? 0 : wrong}
            </div>
            <div className="mt-1 text-xs text-muted">
              {checking ? "that are the wrong recording" : "that are the wrong recording"}
            </div>
          </div>
        </div>

        <p
          className={`mt-5 rounded-lg border px-4 py-3 text-[13px] leading-relaxed ${
            checking
              ? "border-pass/25 bg-pass/[0.07] text-foreground/85"
              : "border-fail/30 bg-fail/[0.07] text-foreground/85"
          }`}
        >
          {checking ? (
            <>
              <strong className="text-pass">{wrong} files were caught</strong> and sent back
              to be collected again properly. The crate is {OUTCOMES.playable} tracks that
              are what they claim to be.
            </>
          ) : (
            <>
              <strong className="text-fail">{wrong} wrong recordings sit in the crate</strong>{" "}
              with perfect tags, indistinguishable from the rest until one of them gets
              loaded. That&rsquo;s roughly one in four of everything collected.
            </>
          )}
        </p>
      </div>

      <h3 className="mb-4 mt-10 font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
        What &ldquo;wrong&rdquo; actually looked like
      </h3>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {examples.map(({ entry, reason }) => {
          const copy = FAILURE_COPY[entry.scenario];
          const want = entry.track.expectedDurationS;
          const got = entry.candidate?.measuredDurationS ?? 0;
          const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
          return (
            <div key={entry.track.id} className="rounded-xl border border-edge bg-panel/60 p-4">
              <div className="text-[15px] font-medium">{copy.headline}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{copy.detail}</p>
              <div className="mt-3.5 flex items-center gap-3 border-t border-edge/70 pt-3 font-mono text-xs">
                <span className="text-muted">expected {fmt(want)}</span>
                <span className="text-muted">→</span>
                <span className={offByRuntime(want, got) ? "text-fail" : "text-muted"}>
                  got {fmt(got)}
                </span>
                <span className="ml-auto rounded border border-fail/30 bg-fail/10 px-1.5 py-0.5 text-[10px] text-fail">
                  rejected
                </span>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                {offByRuntime(want, got)
                  ? "caught on runtime — the file is the wrong length"
                  : "runtime looks right — caught on what the upload called itself"}
              </p>
              <p className="mt-2.5 truncate text-[11px] text-muted" title={entry.candidate?.title}>
                arrived labelled &ldquo;{entry.candidate?.title}&rdquo;
              </p>
            </div>
          );
        })}
      </div>

      <Callout>
        The rules had to be tuned, not guessed. An early version rejected anything whose
        label didn&rsquo;t explicitly confirm the version — which threw out correct files,
        because official uploads routinely drop the remix credit from the title. The fix was
        a third outcome:{" "}
        <strong className="text-foreground">
          &ldquo;nothing confirms this&rdquo; is not the same as &ldquo;something contradicts
          this&rdquo;
        </strong>
        . Unconfirmed files go to a short listen-through queue — about {OUTCOMES.heldForReviewPct}% of
        the catalogue — instead of being thrown away.
      </Callout>
    </Section>
  );
}

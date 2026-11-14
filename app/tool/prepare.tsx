"use client";

import { useMemo, useState } from "react";
import { msPerBeat, secondsPerBar, structureOf, waveformByBar } from "@/lib/library/phrasing";
import type { SectionKind } from "@/lib/library/phrasing";
import type { Track } from "@/lib/library/types";
import { Callout, Section } from "../sections/ui";

const r3 = (x: number) => Math.round(x * 1000) / 1000;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* -------------------------------------------------------------- beatgrid -- */

const BARS = 32;

/**
 * How far the real kick has drifted from a constant-tempo grid, in beats, at
 * a position measured in bars. A programmed record doesn't drift. A
 * live-played one wanders and slowly falls behind — by bar 32 here it's most
 * of a beat out. Continuous, so it works at beat resolution too.
 */
function drift(barPos: number, live: boolean): number {
  if (!live) return 0;
  return r3(0.7 * (barPos / BARS) + 0.07 * Math.sin(barPos * 0.55));
}

/** Segmented control with an unmistakable active state. */
function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-edge p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`rounded-md border px-3 py-1 text-[13px] transition-colors ${
            value === o.value
              ? "border-accent/50 bg-accent/15 text-accent"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** One bar, close up: four beats, where the grid says they are and where the kicks actually land. */
function CloseUp({
  bar,
  live,
  corrected,
  x0,
  width,
}: {
  bar: number;
  live: boolean;
  corrected: boolean;
  x0: number;
  width: number;
}) {
  const from = -0.6;
  const to = 4.6;
  const sx = (beat: number) => Math.round((x0 + ((beat - from) / (to - from)) * width) * 100) / 100;
  const beats = [0, 1, 2, 3, 4];
  const kickAt = (j: number) => j + drift(bar + j / 4, live);
  const gridAt = (j: number) => (corrected ? kickAt(j) : j);
  return (
    <g>
      <rect x={x0} y={22} width={width} height={96} rx={6} className="fill-background/40 stroke-edge" />
      {beats.map((j) => {
        const off = Math.abs(kickAt(j) - gridAt(j));
        return (
          <g key={j}>
            {off > 0.04 && (
              <rect
                x={Math.min(sx(kickAt(j)), sx(gridAt(j)))}
                y={64}
                width={Math.abs(sx(kickAt(j)) - sx(gridAt(j)))}
                height={8}
                className="fill-fail/70"
              />
            )}
            <line x1={sx(gridAt(j))} x2={sx(gridAt(j))} y1={28} y2={112} className="stroke-foreground/60" strokeWidth={2} />
            <rect x={sx(kickAt(j)) - 4} y={44} width={8} height={48} rx={3} className="fill-accent" />
          </g>
        );
      })}
      <text x={x0 + width / 2} y={140} textAnchor="middle" className="fill-muted font-mono text-[18px]">
        bar {bar + 1}
      </text>
    </g>
  );
}

export function Beatgrid({ library }: { library: Track[] }) {
  const live = library.find((t) => t.features.rhythm === "swung") ?? library[0];
  const programmed =
    library.find((t) => t.features.rhythm === "four-on-the-floor" && /extended/i.test(t.title)) ??
    library[1];

  const [which, setWhich] = useState<"live" | "programmed">("live");
  const [grid, setGrid] = useState<"auto" | "corrected">("auto");

  const track = which === "live" ? live : programmed;
  const isLive = which === "live";
  const corrected = grid === "corrected";
  const bpm = track.features.bpm;

  // Error per bar, in milliseconds. Zero everywhere once the grid is corrected.
  const errMs = useMemo(
    () =>
      Array.from({ length: BARS }, (_, b) =>
        corrected ? 0 : Math.round(Math.abs(drift(b, isLive)) * msPerBeat(bpm)),
      ),
    [corrected, isLive, bpm],
  );
  const endMs = errMs[BARS - 1];
  const endBeats = corrected ? 0 : Math.abs(drift(BARS - 1, isLive));
  const fine = endBeats < 0.05;
  const scale = Math.max(400, ...errMs);

  const W = 1000;

  return (
    <Section
      n={6}
      id="beatgrid"
      kicker="Beatgrid"
      title="The grid every other tool trusts"
      lede="Analysis guesses where each beat and bar falls and draws a grid over the waveform. Sync, quantize, loops, beat-jump and every cue point snap to that grid. On most programmed dance records the guess is right. On anything played by people — older disco, live drums, swung grooves — it drifts, and nothing warns you."
    >
      <div className="rounded-xl border border-edge bg-panel/60 p-5">
        <div className="flex flex-wrap gap-3">
          <Segmented
            options={[
              { value: "live", label: "Played groove" },
              { value: "programmed", label: "Programmed groove" },
            ]}
            value={which}
            onChange={setWhich}
          />
          <Segmented
            options={[
              { value: "auto", label: "Auto-detected grid" },
              { value: "corrected", label: "Corrected grid" },
            ]}
            value={grid}
            onChange={setGrid}
          />
        </div>

        <div className="mt-4 text-[13px]">
          <span className="font-medium">{track.title}</span>
          <span className="text-muted"> — {track.artist} · {bpm} BPM</span>
        </div>

        {/* How late the grid is, bar by bar */}
        <h4 className="mt-5 font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
          How far the grid is from the kick, bar by bar
        </h4>
        <svg viewBox={`0 0 ${W} 120`} className="mt-2 w-full" role="img" aria-label="Grid error per bar">
          <line x1={10} x2={W - 10} y1={100} y2={100} className="stroke-edge" />
          {errMs.map((ms, b) => {
            const bw = (W - 20) / BARS;
            const h = Math.round((ms / scale) * 88 * 100) / 100;
            return (
              <rect
                key={b}
                x={Math.round((10 + b * bw + 2) * 100) / 100}
                y={Math.round((100 - h) * 100) / 100}
                width={Math.round((bw - 4) * 100) / 100}
                height={Math.max(h, 1.5)}
                rx={2}
                className={ms > 60 ? "fill-fail/75" : ms > 20 ? "fill-review/75" : "fill-pass/60"}
              />
            );
          })}
          <text x={14} y={116} className="fill-muted font-mono text-[15px]">bar 1</text>
          <text x={W - 14} y={116} textAnchor="end" className="fill-muted font-mono text-[15px]">
            bar 32 · {endMs} ms
          </text>
        </svg>

        {/* Close-ups */}
        <h4 className="mt-5 font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
          Close up: one bar at the start, one at bar 32
        </h4>
        <svg viewBox={`0 0 ${W} 150`} className="mt-2 w-full" role="img" aria-label="Kick drums against grid lines at bar 1 and bar 32">
          <CloseUp bar={0} live={isLive} corrected={corrected} x0={10} width={470} />
          <CloseUp bar={BARS - 1} live={isLive} corrected={corrected} x0={520} width={470} />
        </svg>
        <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><span className="h-3 w-1.5 rounded bg-accent" /> kick drum</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-foreground/60" /> grid line (beat)</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-3 rounded bg-fail/70" /> how far apart</span>
        </div>

        <p
          className={`mt-4 rounded-lg border px-4 py-3 text-[13px] leading-relaxed ${
            fine ? "border-pass/25 bg-pass/[0.07]" : "border-fail/30 bg-fail/[0.07]"
          }`}
        >
          {fine ? (
            <>
              <strong className="text-pass">The grid sits on the kicks all the way through.</strong>{" "}
              {isLive
                ? "This is what fixing it gets you: the grid now follows the drummer rather than assuming one tempo."
                : "Programmed records hold a perfectly steady tempo, so the automatic grid is right and there's nothing to fix."}
            </>
          ) : (
            <>
              <strong className="text-fail">
                By bar 32 the grid is {endBeats.toFixed(2)} beats out — {endMs} ms at {bpm} BPM.
              </strong>{" "}
              The record still sounds fine on its own. It only goes wrong when something trusts the grid.
            </>
          )}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { h: "Sync", b: "Matches the two grids, not the two kicks. A wrong grid locks the records together a fraction of a beat apart, and they flam." },
          { h: "Quantize", b: "Snaps your cue presses to the grid. On a drifting grid every quantized cue fires late." },
          { h: "Loops", b: "Loop length comes from the grid. A loop set against a drifting grid slips out of time each pass." },
          { h: "Beat jump", b: "Jumps by grid beats. Jump 32 beats on a bad grid and you land off the beat." },
        ].map((x) => (
          <div key={x.h} className="rounded-xl border border-edge bg-panel/60 p-4">
            <h4 className="text-[14px] font-medium">{x.h}</h4>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{x.b}</p>
          </div>
        ))}
      </div>

      <Callout>
        crate-check doesn&rsquo;t fix grids — that&rsquo;s Rekordbox&rsquo;s job, and a manual
        one. It&rsquo;s here because skipping it quietly breaks steps further down that
        look like they have nothing to do with it. Where to spend the minute: anything with
        live drums or a swung groove, anything recorded before the early 2000s, and any
        track the analysis gave an odd decimal BPM.
      </Callout>
    </Section>
  );
}

/* ------------------------------------------------------------ cue points -- */

const SECTION_COLOR: Record<SectionKind, string> = {
  intro: "fill-foreground/30",
  groove: "fill-accent/70",
  breakdown: "fill-review/60",
  drop: "fill-fail/75",
  outro: "fill-foreground/30",
};

const SECTION_LABEL: Record<SectionKind, string> = {
  intro: "Intro",
  groove: "Groove",
  breakdown: "Breakdown",
  drop: "Drop",
  outro: "Outro",
};

const CUE_WHY: Record<string, string> = {
  "Mix in": "Where you start the record when it comes in. On a beatless or long intro this is bar 1.",
  "Groove starts": "Where the full beat arrives. A useful target for the bass swap.",
  Breakdown: "Where the energy drops out. Lets you skip straight to the build if the room is ready.",
  Drop: "The payoff after the breakdown. The pad you hit when you want the room to react now.",
  "Outro loop": "An 8-bar loop at the start of the outro. Holds the record steady for as long as the next mix takes.",
};

export function CuePoints({ library }: { library: Track[] }) {
  const choices = useMemo(() => {
    const pick = (pred: (t: Track) => boolean) => library.find(pred);
    return [
      pick((t) => t.features.hasBreakdown && t.features.intro === "long mixable" && /extended/i.test(t.title)),
      pick((t) => t.features.intro === "beatless"),
      pick((t) => t.features.intro === "short" && t.features.hasBreakdown),
    ].filter((t): t is Track => Boolean(t));
  }, [library]);

  const [id, setId] = useState(choices[0]?.id ?? library[0].id);
  const track = library.find((t) => t.id === id) ?? library[0];
  const { sections, cues, totalBars } = useMemo(() => structureOf(track), [track]);
  const wave = useMemo(() => waveformByBar(track), [track]);
  const spb = secondsPerBar(track.features.bpm);

  const W = 1000;
  const H = 140;
  const bw = (W - 20) / totalBars;
  const x = (bar: number) => Math.round((10 + bar * bw) * 100) / 100;
  const kindAt = (bar: number) =>
    sections.find((s) => bar >= s.startBar && bar < s.startBar + s.bars)?.kind ?? "groove";

  return (
    <Section
      n={7}
      id="cues"
      kicker="Cue points"
      title="Mark where things happen, so you press instead of search"
      lede="A cue point is a saved position on the waveform, mapped to a pad on the CDJ. Five per track covers almost everything you'll need to do live — and every one of them assumes the grid underneath is right."
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {choices.map((t) => (
          <button
            key={t.id}
            onClick={() => setId(t.id)}
            className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
              t.id === id ? "border-foreground/40 bg-panel2" : "border-edge text-muted hover:text-foreground"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-edge bg-panel/60 p-5">
        <div className="text-[13px]">
          <span className="font-medium">{track.title}</span>
          <span className="text-muted">
            {" "}— {track.artist} · {track.features.bpm} BPM · {totalBars} bars · {track.features.intro} intro
          </span>
        </div>

        <svg viewBox={`0 0 ${W} ${H + 36}`} className="mt-3 w-full" role="img" aria-label={`Waveform with cue points for ${track.title}`}>
          {wave.map((a, b) => {
            const h = Math.round(a * H * 0.9 * 100) / 100;
            return (
              <rect
                key={b}
                x={x(b)}
                y={Math.round((H / 2 - h / 2 + 10) * 100) / 100}
                width={Math.max(1, Math.round((bw - 0.6) * 100) / 100)}
                height={h}
                className={SECTION_COLOR[kindAt(b)]}
              />
            );
          })}
          {cues.map((c) => (
            <g key={c.label}>
              <line x1={x(c.bar)} x2={x(c.bar)} y1={4} y2={H + 14} className="stroke-foreground" strokeWidth={2} />
              <rect x={x(c.bar) - 1} y={H + 16} width={c.pad === "Loop" ? 46 : 22} height={18} rx={3} className="fill-foreground" />
              <text x={x(c.bar) + (c.pad === "Loop" ? 22 : 10)} y={H + 29} textAnchor="middle" className="fill-background font-mono text-[12px] font-semibold">
                {c.pad}
              </text>
            </g>
          ))}
        </svg>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
          {(Object.keys(SECTION_LABEL) as SectionKind[])
            .filter((k) => sections.some((s) => s.kind === k))
            .map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <svg width="10" height="10"><rect width="10" height="10" rx="2" className={SECTION_COLOR[k]} /></svg>
                {SECTION_LABEL[k]}
              </span>
            ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-edge">
          {cues.map((c) => (
            <div key={c.label} className="flex items-start gap-3 border-t border-edge/60 px-3 py-2.5 text-[13px] first:border-t-0">
              <span className="mt-0.5 w-11 shrink-0 rounded bg-foreground px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold text-background">
                {c.pad}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{c.label}</div>
                <div className="text-[12px] leading-relaxed text-muted">{CUE_WHY[c.label]}</div>
              </div>
              <div className="shrink-0 text-right font-mono text-[12px]">
                <div>bar {c.bar + 1}</div>
                <div className="text-muted">{mmss(c.bar * spb)}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          Arrangements here are illustrative: the analysis this catalogue came from didn&rsquo;t
          extract song structure, so sections are laid out the way dance records usually are —
          in multiples of 8 bars, with the intro and outro sized for mixing.
        </p>
      </div>
    </Section>
  );
}

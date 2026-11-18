"use client";

import { useMemo, useState } from "react";
import {
  bestStartBar,
  describeBar,
  introBars,
  planTransition,
  secondsPerBar,
  structureOf,
  waveformByBar,
} from "@/lib/library/phrasing";
import type { Alignment } from "@/lib/library/phrasing";
import { keyDistance } from "@/lib/library/mixing";
import type { TaggedTrack } from "@/lib/library/types";
import { STEP_BY_ID } from "@/lib/pipeline/steps";
import { Section } from "../sections/ui";

const ALIGN: Record<Alignment, { label: string; tone: string; chip: string; text: string }> = {
  phrase: {
    label: "On the phrase",
    tone: "text-pass",
    chip: "border-pass/40 bg-pass/10 text-pass",
    text: "The incoming record's phrases line up with the outgoing record's. Its changes land exactly where the outgoing record's do, so the blend sounds like one piece of music.",
  },
  "half-phrase": {
    label: "Half-phrase",
    tone: "text-review",
    chip: "border-review/40 bg-review/10 text-review",
    text: "The phrases are 16 bars apart. Usually fine — changes land on the half-phrase — though the bigger moments may not coincide.",
  },
  off: {
    label: "Off the phrase",
    tone: "text-fail",
    chip: "border-fail/40 bg-fail/10 text-fail",
    text: "The phrases don't line up. The beats match, but the incoming record's changes land in the middle of the outgoing record's phrases. That's what an off-phrase mix sounds like: technically matched, musically wrong.",
  },
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Pick the consecutive pair in the planned set that actually mixes best. */
function defaultPair(crate: TaggedTrack[]): [number, number] {
  let best: [number, number] = [0, Math.min(1, crate.length - 1)];
  let bestScore = -Infinity;
  for (let i = 0; i < crate.length - 1; i++) {
    const a = crate[i];
    const b = crate[i + 1];
    const kd = keyDistance(a.features.key, b.features.key) ?? 6;
    const bpm = Math.abs(a.features.bpm - b.features.bpm) / a.features.bpm;
    const score = -kd * 2 - bpm * 100 + (introBars(b) >= 32 ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = [i, i + 1];
    }
  }
  return best;
}

export default function Transition({ crate, shapeName }: { crate: TaggedTrack[]; shapeName: string }) {
  const [pairDefault] = useState(() => defaultPair(crate));
  const [outIdx, setOutIdx] = useState(pairDefault[0]);
  const [inIdx, setInIdx] = useState(pairDefault[1]);

  // The crate changes when the set shape upstream changes.
  const outgoing = crate[Math.min(outIdx, crate.length - 1)];
  const incoming = crate[Math.min(inIdx, crate.length - 1)] ?? crate[0];

  const outStruct = useMemo(() => structureOf(outgoing), [outgoing]);
  const total = outStruct.totalBars;
  const best = useMemo(() => bestStartBar(outgoing, incoming), [outgoing, incoming]);
  const [startBar, setStartBar] = useState<number | null>(null);
  const start = Math.min(startBar ?? best, total - 8);

  const plan = useMemo(() => planTransition(outgoing, incoming, start), [outgoing, incoming, start]);
  const outWave = useMemo(() => waveformByBar(outgoing), [outgoing]);
  const inWave = useMemo(() => waveformByBar(incoming), [incoming]);

  const spb = secondsPerBar(outgoing.features.bpm);
  const kd = keyDistance(outgoing.features.key, incoming.features.key);
  const align = ALIGN[plan.alignment];

  const W = 1000;
  const LANE = 70;
  const x = (bar: number) => round2(10 + (bar / total) * (W - 20));
  const bw = (W - 20) / total;

  const keyText =
    kd === null
      ? "key unknown"
      : kd === 0
        ? "same key"
        : kd === 1
          ? "one move on the wheel — compatible"
          : kd === 2
            ? "two moves — some tension"
            : `${kd} moves — will clash, keep the blend short`;
  const keyTone = kd !== null && kd <= 1 ? "text-pass" : kd === 2 ? "text-review" : "text-fail";

  const pitch = plan.pitchPct;
  const pitchTone = Math.abs(pitch) <= 3 ? "text-pass" : Math.abs(pitch) <= 6 ? "text-review" : "text-fail";
  const runway = introBars(incoming);

  return (
    <Section
      n={STEP_BY_ID.transition.n}
      id="transition"
      kicker="Transition"
      title="Where the incoming record starts decides whether the mix works"
      lede="Matching the beats is the easy part — sync does it. The decision that's audible is when you start the incoming record. Dance music is built in 32-bar phrases, and a mix only sounds like one piece of music if both records change at the same moments. Drag the start point and listen with your eyes."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-muted">Outgoing — playing now</span>
          <select
            value={outIdx}
            onChange={(e) => {
              setOutIdx(Number(e.target.value));
              setStartBar(null);
            }}
            className="w-full rounded-lg border border-edge bg-panel px-3 py-2 text-[13px] outline-none focus:border-accent/50"
          >
            {crate.map((t, i) => (
              <option key={t.id} value={i}>
                {i + 1}. {t.artist} — {t.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] text-muted">Incoming — on the other deck</span>
          <select
            value={inIdx}
            onChange={(e) => {
              setInIdx(Number(e.target.value));
              setStartBar(null);
            }}
            className="w-full rounded-lg border border-edge bg-panel px-3 py-2 text-[13px] outline-none focus:border-accent/50"
          >
            {crate.map((t, i) => (
              <option key={t.id} value={i} disabled={i === outIdx}>
                {i + 1}. {t.artist} — {t.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="-mt-1 mb-4 text-[12px] text-muted">
        Both from your planned {shapeName.toLowerCase()} set. It opens on the pair from that set
        that mixes most cleanly.
      </p>

      <div className="rounded-xl border border-edge bg-panel/60 p-5">
        <svg viewBox={`0 0 ${W} ${LANE * 2 + 60}`} className="w-full" role="img" aria-label="Two decks with phrase boundaries">
          {/* overlap window */}
          <rect
            x={x(plan.startBar)}
            y={4}
            width={Math.max(2, round2(plan.overlapBars * bw))}
            height={LANE * 2 + 26}
            rx={4}
            className="fill-accent/10 stroke-accent/40"
          />

          {/* deck A: outgoing */}
          {outWave.map((a, b) => {
            const h = round2(a * (LANE - 14));
            return (
              <rect
                key={`a${b}`}
                x={x(b)}
                y={round2(10 + (LANE - 14 - h) / 2)}
                width={Math.max(0.8, round2(bw - 0.4))}
                height={h}
                className={b >= plan.startBar + plan.overlapBars ? "fill-foreground/15" : "fill-foreground/45"}
              />
            );
          })}

          {/* deck B: incoming, lined up under its start point */}
          {inWave.map((a, i) => {
            const b = plan.startBar + i;
            if (b >= total) return null;
            const h = round2(a * (LANE - 14));
            return (
              <rect
                key={`b${i}`}
                x={x(b)}
                y={round2(LANE + 20 + (LANE - 14 - h) / 2)}
                width={Math.max(0.8, round2(bw - 0.4))}
                height={h}
                className="fill-accent/70"
              />
            );
          })}

          {/* outgoing phrase lines */}
          {Array.from({ length: Math.floor(total / 16) + 1 }, (_, k) => k * 16).map((b) => (
            <line
              key={`pa${b}`}
              x1={x(b)}
              x2={x(b)}
              y1={6}
              y2={LANE + 2}
              className={b % 32 === 0 ? "stroke-foreground/60" : "stroke-foreground/25"}
              strokeWidth={b % 32 === 0 ? 2 : 1}
            />
          ))}
          {/* incoming phrase lines — line up with the ones above only when the start is on the phrase */}
          {Array.from(
            { length: Math.max(0, Math.floor((total - plan.startBar - plan.anchorBars) / 16) + 1) },
            (_, k) => plan.startBar + plan.anchorBars + k * 16,
          ).map((b, k) =>
            b <= total ? (
              <line
                key={`pb${b}`}
                x1={x(b)}
                x2={x(b)}
                y1={LANE + 16}
                y2={LANE * 2 + 12}
                className={k % 2 === 0 ? "stroke-accent" : "stroke-accent/45"}
                strokeWidth={k % 2 === 0 ? 2 : 1}
              />
            ) : null,
          )}

          {/* bass swap */}
          {plan.bassSwapBar < total && (
            <g>
              <line
                x1={x(plan.bassSwapBar)}
                x2={x(plan.bassSwapBar)}
                y1={2}
                y2={LANE * 2 + 30}
                className="stroke-review"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
              <text x={x(plan.bassSwapBar)} y={LANE * 2 + 46} textAnchor="middle" className="fill-review font-mono text-[16px]">
                bass swap
              </text>
            </g>
          )}
          <text x={x(plan.startBar)} y={LANE * 2 + 46} textAnchor="start" className="fill-accent font-mono text-[16px]">
            {plan.bassSwapBar - plan.startBar < total * 0.12 ? "" : "start ▸"}
          </text>
        </svg>

        <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><span className="h-3 w-2 rounded-sm bg-foreground/45" /> deck A, outgoing</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-2 rounded-sm bg-accent/70" /> deck B, incoming</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-foreground/60" /> phrase (32 bars)</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-accent/40 bg-accent/10" /> overlap</span>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <label htmlFor="startbar" className="text-[13px] font-medium">
              Start the incoming record at
            </label>
            <span className="font-mono text-[13px]">
              bar {plan.startBar + 1} <span className="text-muted">({describeBar(plan.startBar)})</span>
            </span>
          </div>
          <input
            id="startbar"
            type="range"
            min={0}
            max={total - 8}
            step={1}
            value={start}
            onChange={(e) => setStartBar(Number(e.target.value))}
            className="w-full"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-md border px-2 py-0.5 text-[12px] font-medium ${align.chip}`}>{align.label}</span>
            <button
              onClick={() => setStartBar(best)}
              className="rounded-md border border-edge px-2 py-0.5 text-[12px] text-muted transition-colors hover:text-foreground"
            >
              Snap to the textbook start
            </button>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-foreground/80">{align.text}</p>
          {plan.anchorBars > 0 && (
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              This record has a {plan.anchorBars}-bar lead-in before its first phrase, so you press
              play {plan.anchorBars} bars <em>before</em> the boundary — its first phrase then lands
              on it. Starting it exactly on the boundary is a common way to end up off the phrase.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-edge bg-panel/60 p-4">
          <div className="text-[12px] text-muted">Overlap</div>
          <div className="mt-1 font-mono text-xl">{plan.overlapBars} bars</div>
          <div className="text-[12px] text-muted">{Math.round(plan.overlapBars * spb)} seconds with both playing</div>
        </div>
        <div className="rounded-xl border border-edge bg-panel/60 p-4">
          <div className="text-[12px] text-muted">Bass swap</div>
          <div className={`mt-1 font-mono text-xl ${ALIGN[plan.bassSwapAlignment].tone}`}>bar {plan.bassSwapBar + 1}</div>
          <div className="text-[12px] text-muted">
            {runway === 0 ? "cold open — no runway, cut rather than blend" : `after the incoming ${runway}-bar intro`}
          </div>
        </div>
        <div className="rounded-xl border border-edge bg-panel/60 p-4">
          <div className="text-[12px] text-muted">Tempo</div>
          <div className={`mt-1 font-mono text-xl ${pitchTone}`}>
            {pitch >= 0 ? "+" : ""}
            {pitch.toFixed(1)}%
          </div>
          <div className="text-[12px] text-muted">
            incoming pitched {incoming.features.bpm} → {outgoing.features.bpm} BPM
          </div>
        </div>
        <div className="rounded-xl border border-edge bg-panel/60 p-4">
          <div className="text-[12px] text-muted">Key</div>
          <div className={`mt-1 font-mono text-xl ${keyTone}`}>
            {outgoing.features.key} → {incoming.features.key}
          </div>
          <div className="text-[12px] text-muted">{keyText}</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-edge bg-panel/60 p-5">
        <h3 className="text-[14px] font-medium">What your hands do</h3>
        <ol className="mt-3 space-y-2.5 text-[13px] leading-relaxed">
          <li className="flex gap-3">
            <span className="w-16 shrink-0 font-mono text-[12px] text-accent">bar {plan.startBar + 1}</span>
            <span className="text-muted">
              Press play on deck B. Its bass EQ is already turned all the way down, so only its
              hats and percussion come through under the outgoing record.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="w-16 shrink-0 font-mono text-[12px] text-review">bar {plan.bassSwapBar + 1}</span>
            <span className="text-muted">
              Swap the bass: deck A&rsquo;s low EQ down, deck B&rsquo;s up, on the same beat. Two
              bass lines at once is mud; swapping them is the moment the room feels the change.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="w-16 shrink-0 font-mono text-[12px] text-muted">
              bar {Math.min(total, plan.startBar + plan.overlapBars) + 1}
            </span>
            <span className="text-muted">
              Pull deck A&rsquo;s fader down. The outgoing record is gone; deck B is now the set.
            </span>
          </li>
        </ol>
        {plan.overlapBars < runway && (
          <p className="mt-3 rounded-lg border border-fail/30 bg-fail/[0.07] px-3 py-2 text-[13px] text-foreground/80">
            The outgoing record runs out {plan.outgoingBarsLeft} bars after this start point — less
            than the incoming record&rsquo;s {runway}-bar intro. Start earlier, or loop the outro
            (cue <span className="font-mono">Loop</span>) to buy the time.
          </p>
        )}
      </div>
    </Section>
  );
}

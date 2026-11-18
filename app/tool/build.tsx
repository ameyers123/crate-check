"use client";

import { useMemo, useState } from "react";
import { hasTag } from "@/lib/library/tagger";
import { SET_SHAPES } from "@/lib/library/setshapes";
import type { PlannedSlot, SetShape } from "@/lib/library/setshapes";
import { keyDistance } from "@/lib/library/mixing";
import type { TaggedTrack } from "@/lib/library/types";
import { VIBE_TAGS } from "@/lib/library/types";
import { STEP_BY_ID } from "@/lib/pipeline/steps";
import { Section } from "../sections/ui";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

function Row({ t, prev }: { t: TaggedTrack; prev?: TaggedTrack }) {
  const d = prev ? keyDistance(prev.features.key, t.features.key) : null;
  const keyOk = d !== null && d <= 1;
  return (
    <div className="flex items-center gap-3 border-t border-edge/60 px-3 py-2.5 text-[13px]">
      <div className="min-w-0 flex-1">
        <div className="truncate">{t.title}</div>
        <div className="truncate text-[11px] text-muted">{t.artist}</div>
      </div>
      <div className="shrink-0 font-mono text-[11px] text-muted">{mmss(t.features.durationS)}</div>
      <div className="w-10 shrink-0 text-right font-mono text-[12px]">{t.energy}</div>
      <div className="w-12 shrink-0 text-right font-mono text-[12px]">{t.features.bpm}</div>
      <div
        className={`w-9 shrink-0 text-right font-mono text-[12px] ${keyOk ? "text-pass" : "text-muted"}`}
        title={keyOk ? "harmonically compatible with the track above" : undefined}
      >
        {t.features.key}
      </div>
    </div>
  );
}

export default function Build({
  tracks,
  shape,
  plan,
  onShapeChange,
}: {
  tracks: TaggedTrack[];
  shape: SetShape;
  plan: PlannedSlot[];
  onShapeChange: (id: string) => void;
}) {
  const shapeId = shape.id;
  const setShapeId = onShapeChange;

  const [vibe, setVibe] = useState<string>("Hypnotic");
  const [bpm, setBpm] = useState<[number, number]>([115, 135]);

  const matches = useMemo(
    () =>
      tracks
        .filter((t) => hasTag(t, vibe))
        .filter((t) => t.features.bpm >= bpm[0] && t.features.bpm <= bpm[1])
        .sort((a, b) => a.features.bpm - b.features.bpm),
    [tracks, vibe, bpm],
  );

  const curveMax = 10;

  return (
    <Section
      n={STEP_BY_ID.plan.n}
      id="plan"
      kicker="Plan"
      title="A set has a shape, and the shape depends on the job"
      lede="Opening for someone else is a different task from closing a room at 4am. Each shape below is a target energy curve; the planner fills it from the library, preferring tracks whose energy and function match what that point in the night needs."
    >
      {/* Shape selector */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {SET_SHAPES.map((s) => (
          <button
            key={s.id}
            onClick={() => setShapeId(s.id)}
            className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
              shapeId === s.id
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-edge text-muted hover:text-foreground"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-edge bg-panel/60 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[15px] font-medium">{shape.name}</h3>
          <span className="font-mono text-[12px] text-muted">{shape.length}</span>
        </div>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">{shape.job}</p>

        {/* Energy curve: target vs what the planner found */}
        <div className="mt-5 flex h-32 items-end gap-1.5 overflow-hidden rounded-lg border border-edge/70 bg-background/40 p-3">
          {plan.map((slot, i) => (
            <div
              key={i}
              className="relative h-full flex-1"
              title={`${slot.track.title} — energy ${slot.track.energy}/10, target ${slot.target}/10`}
            >
              <div
                className="absolute inset-x-0 bottom-0 rounded-t bg-accent/80 transition-all duration-500"
                style={{ height: `${(slot.track.energy / curveMax) * 100}%` }}
              />
              <div
                className="absolute inset-x-0 border-t border-dashed border-muted/70 transition-all duration-500"
                style={{ bottom: `${(slot.target / curveMax) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] text-muted">
          <span>start</span>
          <span>solid = chosen track&rsquo;s energy · dashed = target</span>
          <span>end</span>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-edge">
          <div className="flex items-center justify-between bg-panel px-3 py-2 text-[12px] text-muted">
            <span>{plan.length} tracks</span>
            <span className="font-mono text-[11px]">energy · bpm · key</span>
          </div>
          {plan.map((slot, i) => (
            <Row key={slot.track.id} t={slot.track} prev={plan[i - 1]?.track} />
          ))}
        </div>
      </div>

      {/* Vibe search */}
      <div className="mt-4 rounded-xl border border-edge bg-panel/60 p-5">
        <h3 className="text-[15px] font-medium">Or just search by feel</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Rekordbox can filter by BPM and key, because those are measurable. It has no idea
          which of your tracks are hypnotic and which are euphoric.
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {VIBE_TAGS.map((v) => (
            <button
              key={v}
              onClick={() => setVibe(v)}
              className={`rounded-lg border px-2.5 py-1 text-[13px] transition-colors ${
                vibe === v
                  ? "border-review/50 bg-review/15 text-review"
                  : "border-edge text-muted hover:text-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {([0, 1] as const).map((idx) => (
            <div key={idx}>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[13px] text-muted">
                  {idx === 0 ? "Lowest" : "Highest"} BPM
                </span>
                <span className="font-mono text-[13px] text-accent">{bpm[idx]}</span>
              </div>
              <input
                type="range"
                min={85}
                max={140}
                value={bpm[idx]}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setBpm(idx === 0 ? [Math.min(v, bpm[1]), bpm[1]] : [bpm[0], Math.max(v, bpm[0])]);
                }}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-edge">
          <div className="flex items-center justify-between bg-panel px-3 py-2 text-[12px] text-muted">
            <span>
              {matches.length} tagged <span className="text-review">{vibe}</span> between{" "}
              {bpm[0]} and {bpm[1]} BPM
            </span>
            <span className="font-mono text-[11px]">energy · bpm · key</span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {matches.length === 0 ? (
              <p className="px-3 py-6 text-center text-[13px] text-muted">
                Nothing matches. Widen the range or pick another feel.
              </p>
            ) : (
              matches.map((t) => <Row key={t.id} t={t} />)
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

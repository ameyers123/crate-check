"use client";

import { useMemo, useState } from "react";
import { hasTag, tagLibrary } from "@/lib/library/tagger";
import type { TaggedTrack, Track } from "@/lib/library/types";
import { SET_ARC, VIBE_TAGS } from "@/lib/library/types";
import { Section } from "../sections/ui";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/** Camelot neighbours: same number ±1, or the relative major/minor. */
function harmonic(key: string): string[] {
  const m = /^(\d+)([AB])$/.exec(key);
  if (!m) return [];
  const n = Number(m[1]);
  const letter = m[2];
  const wrap = (x: number) => ((x - 1 + 12) % 12) + 1;
  return [`${wrap(n - 1)}${letter}`, `${wrap(n + 1)}${letter}`, `${n}${letter === "A" ? "B" : "A"}`];
}

function TrackRow({ t, nextOf }: { t: TaggedTrack; nextOf?: TaggedTrack }) {
  const compatible = nextOf ? harmonic(nextOf.features.key).includes(t.features.key) : false;
  return (
    <div className="flex items-center gap-3 border-t border-edge/60 px-3 py-2.5 text-[13px]">
      <div className="min-w-0 flex-1">
        <div className="truncate">{t.title}</div>
        <div className="truncate text-[11px] text-muted">{t.artist}</div>
      </div>
      <div className="shrink-0 font-mono text-[11px] text-muted">{mmss(t.features.durationS)}</div>
      <div className="w-12 shrink-0 text-right font-mono text-[12px]">{t.features.bpm}</div>
      <div
        className={`w-10 shrink-0 text-right font-mono text-[12px] ${compatible ? "text-pass" : "text-muted"}`}
        title={compatible ? "harmonically compatible with the previous track" : undefined}
      >
        {t.features.key}
      </div>
    </div>
  );
}

export default function Build({ library }: { library: Track[] }) {
  const { tracks } = useMemo(() => tagLibrary(library), [library]);

  const [vibe, setVibe] = useState<string>("Hypnotic");
  const [bpm, setBpm] = useState<[number, number]>([118, 132]);

  const matches = useMemo(
    () =>
      tracks
        .filter((t) => hasTag(t, vibe))
        .filter((t) => t.features.bpm >= bpm[0] && t.features.bpm <= bpm[1])
        .sort((a, b) => a.features.bpm - b.features.bpm),
    [tracks, vibe, bpm],
  );

  // A set that climbs through the arc, each phase ordered by BPM.
  const set = useMemo(() => {
    const perPhase = { "Warm-up": 3, Driving: 3, Peak: 3, Afterhours: 2 } as const;
    const out: { phase: string; track: TaggedTrack }[] = [];
    for (const phase of SET_ARC) {
      const pool = tracks
        .filter((t) => hasTag(t, phase))
        .sort((a, b) => a.features.bpm - b.features.bpm);
      const n = perPhase[phase];
      const step = Math.max(1, Math.floor(pool.length / n));
      for (let i = 0; i < n && i * step < pool.length; i++) {
        out.push({ phase, track: pool[i * step] });
      }
    }
    return out;
  }, [tracks]);

  const setBpms = set.map((s) => s.track.features.bpm);
  const bpmLo = Math.min(...setBpms, 110);
  const bpmHi = Math.max(...setBpms, 135);

  return (
    <Section
      n={5}
      id="build"
      kicker="Build"
      title="Search by feel, not by filename"
      lede="Once every track carries vibe and function tags, two things become possible that aren't possible in Rekordbox: finding tracks by how they feel, and building a set that moves through the shape of a night."
    >
      {/* Vibe search */}
      <div className="rounded-xl border border-edge bg-panel/60 p-5">
        <h3 className="text-[15px] font-medium">Build me a set of this feel</h3>
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
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[13px] text-muted">Lowest BPM</span>
              <span className="font-mono text-[13px] text-accent">{bpm[0]}</span>
            </div>
            <input
              type="range"
              min={100}
              max={145}
              value={bpm[0]}
              onChange={(e) => setBpm([Math.min(Number(e.target.value), bpm[1]), bpm[1]])}
              className="w-full"
            />
          </div>
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[13px] text-muted">Highest BPM</span>
              <span className="font-mono text-[13px] text-accent">{bpm[1]}</span>
            </div>
            <input
              type="range"
              min={100}
              max={145}
              value={bpm[1]}
              onChange={(e) => setBpm([bpm[0], Math.max(Number(e.target.value), bpm[0])])}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-edge">
          <div className="flex items-center justify-between bg-panel px-3 py-2 text-[12px] text-muted">
            <span>
              {matches.length} track{matches.length === 1 ? "" : "s"} tagged{" "}
              <span className="text-review">{vibe}</span> between {bpm[0]} and {bpm[1]} BPM
            </span>
            <span className="font-mono text-[11px]">bpm · key</span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {matches.length === 0 ? (
              <p className="px-3 py-6 text-center text-[13px] text-muted">
                Nothing matches. Widen the BPM range or pick another feel.
              </p>
            ) : (
              matches.slice(0, 40).map((t) => <TrackRow key={t.id} t={t} />)
            )}
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          This is the query that isn&rsquo;t possible today. Rekordbox can filter by BPM and
          key, because those are measurable. It has no idea which of your tracks are
          hypnotic and which are euphoric.
        </p>
      </div>

      {/* Set arc */}
      <div className="mt-4 rounded-xl border border-edge bg-panel/60 p-5">
        <h3 className="text-[15px] font-medium">A set has a shape</h3>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
          You open slower and softer, build, peak, then bring it down. The function tags map
          directly onto that, so a starting order can be assembled automatically and then
          rearranged by ear.
        </p>

        {/* BPM curve */}
        <div className="mt-5 flex h-28 items-end gap-1 rounded-lg border border-edge/70 bg-background/40 p-3">
          {set.map(({ phase, track }, i) => {
            const h = ((track.features.bpm - bpmLo) / (bpmHi - bpmLo || 1)) * 100;
            const tone =
              phase === "Warm-up" ? "bg-pass/60"
              : phase === "Driving" ? "bg-accent/70"
              : phase === "Peak" ? "bg-fail/70"
              : "bg-review/60";
            return (
              <div
                key={i}
                className="flex h-full flex-1 items-end"
                title={`${track.title} · ${track.features.bpm} BPM`}
              >
                <div
                  className={`w-full rounded-t ${tone} transition-all`}
                  style={{ height: `${Math.max(h, 10)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] text-muted">
          <span>opening</span>
          <span>{bpmLo}–{bpmHi} BPM across the night</span>
          <span>close</span>
        </div>

        <div className="mt-5 space-y-4">
          {SET_ARC.map((phase) => {
            const rows = set.filter((s) => s.phase === phase);
            if (rows.length === 0) return null;
            return (
              <div key={phase} className="overflow-hidden rounded-lg border border-edge">
                <div className="bg-panel px-3 py-2 text-[12px]">
                  <span className="font-medium">{phase}</span>
                  <span className="ml-2 text-muted">
                    {phase === "Warm-up" && "room filling, keep it patient"}
                    {phase === "Driving" && "lock into a groove, raise the energy"}
                    {phase === "Peak" && "the part people came for"}
                    {phase === "Afterhours" && "thin it out, let it breathe"}
                  </span>
                </div>
                {rows.map(({ track }, i) => (
                  <TrackRow key={track.id} t={track} nextOf={i > 0 ? rows[i - 1].track : undefined} />
                ))}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          Keys shown in green are harmonically compatible with the track above them, so you
          can see where a transition will sit cleanly before you try it.
        </p>
      </div>
    </Section>
  );
}

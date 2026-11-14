"use client";

import { useMemo, useState } from "react";
import { tagLibrary } from "@/lib/library/tagger";
import {
  EMERGENCY_COPY,
  compatibleKeys,
  emergencyOptions,
  parseCamelot,
  whatFitsNext,
} from "@/lib/library/mixing";
import type { Emergency, NextCandidate, Signal } from "@/lib/library/mixing";
import type { TaggedTrack, Track } from "@/lib/library/types";
import { Section } from "../sections/ui";

const TONE: Record<Signal["verdict"], string> = {
  good: "text-pass",
  ok: "text-review",
  bad: "text-fail",
};
const DOT: Record<Signal["verdict"], string> = {
  good: "bg-pass",
  ok: "bg-review",
  bad: "bg-fail",
};

/** The Camelot wheel: 12 numbers, two rings. Neighbours and the ring-swap work. */
function Wheel({ current }: { current: string }) {
  const compat = new Set(compatibleKeys(current));
  const parsed = parseCamelot(current);
  const size = 190;
  const c = size / 2;

  const seg = (n: number, letter: "A" | "B") => {
    const key = `${n}${letter}`;
    const isCurrent = key === current;
    const isCompat = compat.has(key) && !isCurrent;
    const angle = ((n - 1) / 12) * Math.PI * 2 - Math.PI / 2;
    const r = letter === "A" ? 46 : 74;
    // Rounded: unrounded trig differs in its last float digit between the
    // server and client renders, which React reports as a hydration mismatch.
    const x = Math.round((c + Math.cos(angle) * r) * 100) / 100;
    const y = Math.round((c + Math.sin(angle) * r) * 100) / 100;
    return (
      <g key={key}>
        <circle
          cx={x}
          cy={y}
          r={13}
          className={
            isCurrent
              ? "fill-accent"
              : isCompat
                ? "fill-pass/30 stroke-pass/70"
                : "fill-panel2 stroke-edge"
          }
          strokeWidth={1}
        />
        <text
          x={x}
          y={y + 3.5}
          textAnchor="middle"
          className={`text-[9px] font-mono ${
            isCurrent ? "fill-background" : isCompat ? "fill-pass" : "fill-muted"
          }`}
        >
          {key}
        </text>
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} role="img" aria-label={`Camelot wheel, current key ${current}`}>
        <circle cx={c} cy={c} r={46} className="fill-none stroke-edge/50" />
        <circle cx={c} cy={c} r={74} className="fill-none stroke-edge/50" />
        {Array.from({ length: 12 }, (_, i) => seg(i + 1, "A"))}
        {Array.from({ length: 12 }, (_, i) => seg(i + 1, "B"))}
      </svg>
      <p className="mt-2 text-center text-[12px] leading-relaxed text-muted">
        Playing <span className="font-mono text-accent">{current}</span>
        {parsed && (
          <>
            {" "}
            — you can move to{" "}
            <span className="font-mono text-pass">
              {compatibleKeys(current).filter((k) => k !== current).join(", ")}
            </span>
          </>
        )}
      </p>
    </div>
  );
}

function CandidateCard({ c, rank }: { c: NextCandidate; rank?: number }) {
  return (
    <div className="rounded-xl border border-edge bg-panel/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {rank !== undefined && (
              <span className="font-mono text-[11px] text-muted">{rank + 1}</span>
            )}
            <span className="truncate text-[14px] font-medium">{c.track.title}</span>
          </div>
          <div className="truncate text-[12px] text-muted">{c.track.artist}</div>
        </div>
        <div className="shrink-0 text-right font-mono text-[12px]">
          <div>{c.track.features.bpm}</div>
          <div className="text-muted">{c.track.features.key}</div>
        </div>
      </div>
      <div className="mt-3 grid gap-1.5 border-t border-edge/70 pt-3">
        {c.signals.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-[12px]">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[s.verdict]}`} />
            <span className="w-14 shrink-0 text-muted">{s.label}</span>
            <span className={TONE[s.verdict]}>{s.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Live({ library }: { library: Track[] }) {
  const { tracks } = useMemo(() => tagLibrary(library), [library]);
  const [currentId, setCurrentId] = useState(
    () => tracks.find((t) => t.tags.some((x) => x.name === "Driving"))?.id ?? tracks[0].id,
  );
  const [emergency, setEmergency] = useState<Emergency | null>(null);

  const current = tracks.find((t) => t.id === currentId) as TaggedTrack;
  const next = useMemo(() => whatFitsNext(current, tracks, { limit: 5 }), [current, tracks]);
  const rescue = useMemo(
    () => (emergency ? emergencyOptions(current, tracks, emergency) : []),
    [emergency, current, tracks],
  );

  return (
    <Section
      n={6}
      id="live"
      kicker="Play live"
      title="In the booth, you have about two minutes to decide"
      lede="This is where the tags pay for themselves. The track playing sets four constraints — key, tempo, energy and how much runway the next record gives you — and the library can be ranked against all four at once instead of you remembering."
    >
      <div className="mb-4">
        <label className="mb-2 block text-[13px] text-muted">Currently playing</label>
        <select
          value={currentId}
          onChange={(e) => {
            setCurrentId(e.target.value);
            setEmergency(null);
          }}
          className="w-full rounded-lg border border-edge bg-panel px-3 py-2.5 text-[14px] outline-none focus:border-accent/50"
        >
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.artist} — {t.title} ({t.features.bpm} BPM, {t.features.key})
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        {/* Now playing + what fits next */}
        <div className="space-y-3">
          <div className="rounded-xl border border-accent/30 bg-accent/[0.06] p-5">
            <div className="font-mono text-[11px] tracking-[0.18em] text-accent uppercase">
              Now playing
            </div>
            <div className="mt-2 text-[17px] font-medium">{current.title}</div>
            <div className="text-[13px] text-muted">{current.artist}</div>
            <div className="mt-4 grid grid-cols-4 gap-3 border-t border-accent/20 pt-4">
              <div>
                <div className="font-mono text-xl">{current.features.bpm}</div>
                <div className="text-[11px] text-muted">BPM</div>
              </div>
              <div>
                <div className="font-mono text-xl">{current.features.key}</div>
                <div className="text-[11px] text-muted">key</div>
              </div>
              <div>
                <div className="font-mono text-xl">{current.energy}</div>
                <div className="text-[11px] text-muted">energy</div>
              </div>
              <div>
                <div className="font-mono text-xl">
                  {Math.floor(current.features.durationS / 60)}:
                  {String(current.features.durationS % 60).padStart(2, "0")}
                </div>
                <div className="text-[11px] text-muted">length</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {current.tags
                .filter((t) => t.group !== "genre")
                .map((t) => (
                  <span
                    key={t.name}
                    className="rounded border border-edge bg-panel px-1.5 py-0.5 text-[11px] text-muted"
                  >
                    {t.name}
                  </span>
                ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2.5 font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
              What fits next
            </h3>
            <div className="space-y-2">
              {next.map((c, i) => (
                <CandidateCard key={c.track.id} c={c} rank={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Wheel + emergency */}
        <div className="space-y-3">
          <div className="rounded-xl border border-edge bg-panel/60 p-4">
            <h3 className="mb-3 font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
              Key wheel
            </h3>
            <Wheel current={current.features.key} />
          </div>

          <div className="rounded-xl border border-fail/25 bg-fail/[0.05] p-4">
            <h3 className="font-mono text-[11px] tracking-[0.18em] text-fail uppercase">
              Something&rsquo;s going wrong
            </h3>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Three things actually go wrong in a set. Each of these filters the library to
              what you can genuinely play from where you are right now.
            </p>
            <div className="mt-3 space-y-1.5">
              {(Object.keys(EMERGENCY_COPY) as Emergency[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setEmergency(emergency === k ? null : k)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-[13px] transition-colors ${
                    emergency === k
                      ? "border-fail/50 bg-fail/15 text-fail"
                      : "border-edge bg-panel/60 hover:border-fail/40"
                  }`}
                >
                  {EMERGENCY_COPY[k].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {emergency && (
        <div className="mt-4 rounded-xl border border-fail/25 bg-fail/[0.05] p-5">
          <h3 className="text-[15px] font-medium">{EMERGENCY_COPY[emergency].label}</h3>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted">
            {EMERGENCY_COPY[emergency].what}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {rescue.length === 0 ? (
              <p className="text-[13px] text-muted">
                Nothing in this library fits from here — which is itself useful to know
                before you need it.
              </p>
            ) : (
              rescue.map((c) => <CandidateCard key={c.track.id} c={c} />)
            )}
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            h: "Key",
            b: "Same key, one step round the wheel, or the swap between inner and outer ring at the same number. Anything further and the two records fight.",
          },
          {
            h: "Tempo",
            b: "Within about 3% is comfortable on the pitch fader. Up to 6% is a stretch. Past that you need a track that opens beatless, or you cut.",
          },
          {
            h: "Energy",
            b: "Holding or lifting a point or two keeps a floor. Dropping two or more empties it, unless that's the move you meant to make.",
          },
        ].map((x) => (
          <div key={x.h} className="rounded-xl border border-edge bg-panel/60 p-4">
            <h4 className="text-[14px] font-medium">{x.h}</h4>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{x.b}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

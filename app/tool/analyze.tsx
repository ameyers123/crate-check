"use client";

import { useMemo, useState } from "react";
import { tagTrack, computeThresholds } from "@/lib/library/tagger";
import type { Tag, Track } from "@/lib/library/types";
import { Section } from "../sections/ui";

const GROUP_STYLE: Record<Tag["group"], string> = {
  genre: "border-accent/35 bg-accent/10 text-accent",
  vibe: "border-review/35 bg-review/10 text-review",
  function: "border-foreground/25 bg-foreground/10 text-foreground/90",
};

const GROUP_NOTE: Record<Tag["group"], string> = {
  genre: "What it is",
  vibe: "How it feels",
  function: "Where it goes in a night",
};

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[12px] text-muted">{label}</span>
        <span className="font-mono text-[11px] text-foreground/70">{value.toFixed(2)}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-edge">
        <div
          className="h-full rounded-full bg-foreground/50 transition-[width] duration-500"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function Analyze({ library }: { library: Track[] }) {
  const thresholds = useMemo(() => computeThresholds(library), [library]);
  // A few tracks with genuinely different characters, so switching shows contrast.
  const picks = useMemo(
    () => [library[4], library[17], library[41], library[66]].filter(Boolean),
    [library],
  );
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  const track = picks[idx];
  const tagged = useMemo(() => tagTrack(track, thresholds), [track, thresholds]);
  const f = track.features;

  const byGroup = (g: Tag["group"]) => tagged.tags.filter((t) => t.group === g);

  return (
    <Section
      n={4}
      kicker="Analyze & tag"
      id="analyze"
      title="A file goes in. Something searchable comes out."
      lede="An audio file by itself is a filename and a waveform. The analyzer reads it and returns numbers; the tagger turns those numbers into words you'd actually type into a search box. Every tag shows the rule that produced it, so you can disagree with it."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {picks.map((p, i) => (
          <button
            key={p.id}
            onClick={() => {
              setIdx(i);
              setDone(false);
            }}
            className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
              i === idx ? "border-foreground/40 bg-panel2" : "border-edge text-muted hover:text-foreground"
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
        {/* The raw file */}
        <div className="rounded-xl border border-edge bg-panel/60 p-5">
          <div className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            1 · The file
          </div>
          <div className="mt-4 rounded-lg border border-edge/70 bg-background/50 p-4">
            <div className="font-mono text-[13px] break-all">
              {track.artist} - {track.title}.mp3
            </div>
            <div className="mt-2 font-mono text-[11px] text-muted">
              {mmss(f.durationS)} · 320 kbps
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-muted">
            This is everything your library knows before analysis: a name and a length. You
            cannot search it by feel, and you cannot tell where it belongs in a set.
          </p>
          {!done && (
            <button
              onClick={() => setDone(true)}
              className="mt-5 w-full rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 text-[14px] font-medium text-accent transition-colors hover:bg-accent/20"
            >
              Analyze this track →
            </button>
          )}
        </div>

        <div className="hidden items-center justify-center lg:flex">
          <span className={`font-mono text-xl transition-colors ${done ? "text-accent" : "text-edge"}`}>
            →
          </span>
        </div>

        {/* What comes back */}
        <div
          className={`rounded-xl border p-5 transition-opacity ${
            done ? "border-edge bg-panel/60 opacity-100" : "border-edge/50 bg-panel/20 opacity-45"
          }`}
        >
          <div className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            2 · What the analyzer measures
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 border-b border-edge/70 pb-4">
            <div>
              <div className="font-mono text-xl">{done ? f.bpm : "—"}</div>
              <div className="text-[11px] text-muted">BPM</div>
            </div>
            <div>
              <div className="font-mono text-xl">{done ? f.key : "—"}</div>
              <div className="text-[11px] text-muted">key</div>
            </div>
            <div>
              <div className="font-mono text-xl">
                {done ? (f.vocal >= 0.5 ? "vocal" : "instr.") : "—"}
              </div>
              <div className="text-[11px] text-muted">voice</div>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {done ? (
              <>
                <Meter label="danceability" value={f.danceability} />
                <Meter label="party" value={f.mood.party} />
                <Meter label="relaxed" value={f.mood.relaxed} />
                <Meter label="aggressive" value={f.mood.aggressive} />
                <Meter label="dark" value={f.mood.dark} />
                <Meter label="groovy" value={f.mood.groovy} />
              </>
            ) : (
              <p className="text-[13px] leading-relaxed text-muted">
                Probabilities for mood, danceability, voice, and a score for every genre
                family — around forty numbers per track.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* The tags */}
      <div
        className={`mt-3 rounded-xl border p-5 transition-opacity ${
          done ? "border-accent/30 bg-accent/[0.05] opacity-100" : "border-edge/50 bg-panel/20 opacity-45"
        }`}
      >
        <div className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
          3 · What you can actually search by
        </div>

        {done ? (
          <div className="mt-4 space-y-5">
            {(["genre", "vibe", "function"] as const).map((g) => {
              const tags = byGroup(g);
              if (tags.length === 0) return null;
              return (
                <div key={g}>
                  <div className="mb-2 text-[12px] text-muted">{GROUP_NOTE[g]}</div>
                  <div className="space-y-1.5">
                    {tags.map((t) => (
                      <div key={t.name} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[13px] font-medium ${GROUP_STYLE[g]}`}
                        >
                          {t.name}
                        </span>
                        <span className="font-mono text-[11px] text-muted">{t.trace}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-[13px] text-muted">Run the analysis to see the tags.</p>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-edge bg-panel/60 p-4">
          <h3 className="text-[14px] font-medium">Tags overlap on purpose</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            A track can be Tech House and Techno, Party and Hypnotic. One genre slot per
            track is why library tools are bad at finding a specific record — the single
            slot is always the wrong one for the search you&rsquo;re doing.
          </p>
        </div>
        <div className="rounded-xl border border-edge bg-panel/60 p-4">
          <h3 className="text-[14px] font-medium">Thresholds come from your library</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            &ldquo;Dark&rdquo; means dark relative to what you own. A fixed cutoff would tag
            everything in a techno library and nothing in a disco one, so the bar is a
            percentile of your own collection.
          </p>
        </div>
      </div>
    </Section>
  );
}

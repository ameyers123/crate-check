"use client";

import { useMemo, useState } from "react";
import { tagTrack, computeThresholds } from "@/lib/library/tagger";
import type { Thresholds } from "@/lib/library/tagger";
import { REFERENCE_CORPUS_SIZE, REFERENCE_THRESHOLDS } from "@/lib/library/reference";
import type { Tag, Track } from "@/lib/library/types";
import { Section } from "../sections/ui";

const GROUP_STYLE: Record<Tag["group"], string> = {
  genre: "border-accent/35 bg-accent/10 text-accent",
  vibe: "border-review/35 bg-review/10 text-review",
  function: "border-foreground/25 bg-foreground/10 text-foreground/90",
  role: "border-fail/35 bg-fail/10 text-fail",
};

const GROUP_NOTE: Record<Tag["group"], string> = {
  genre: "What it is",
  vibe: "How it feels",
  function: "Where it goes in a night",
  role: "What it\u2019s for when things go wrong",
};

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/**
 * The demo tracks, chosen for contrast rather than taste: a warm-up vocal, an
 * afterhours tool, a peak-time floor saver, and one that breaks the assumption
 * that tempo decides everything.
 */
const DEMO_PICKS = [
  { match: "Africa", scenario: "energy 1, still a Reset" },
  { match: "Melodic Phase", scenario: "afterhours tool" },
  { match: "September", scenario: "the floorfiller" },
  { match: "Mr. Brightside", scenario: "148 BPM, energy 10" },
];

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

/**
 * The comparison the rest of this page keeps asserting.
 *
 * Every library tool shows the left-hand columns, because every one of them is
 * measurable and unambiguous. None of them answers the question you actually
 * have at 1am.
 */
function LibraryGrid({ library, thresholds }: { library: Track[]; thresholds: Thresholds }) {
  const rows = useMemo(() => {
    const picks = ["Africa", "Billie Jean", "Melodic Phase", "September", "Nanana", "Mr. Brightside"]
      .map((q) => library.find((t) => t.title.includes(q)))
      .filter((t): t is Track => Boolean(t));
    return (picks.length ? picks : library.slice(0, 6)).map((t) => tagTrack(t, thresholds));
  }, [library, thresholds]);

  const feel = (t: (typeof rows)[number]) =>
    t.tags.filter((x) => x.group !== "genre").map((x) => x.name);

  return (
    <div className="mt-6 rounded-xl border border-edge bg-panel/60 p-5">
      <h3 className="text-[15px] font-medium">What a library browser shows you, and what it can&rsquo;t</h3>
      <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-muted">
        The left is every column Rekordbox, Serato or Traktor will give you. All of it is
        measurable, which is why everyone has it. Sort by BPM, filter by key, and you still
        cannot ask for something hypnotic to open with, or for the record that will pull a
        drifting floor back.
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-edge">
          <div className="bg-panel px-3 py-2 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            Your library today
          </div>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-t border-edge/60 bg-background/40 px-3 py-1.5 font-mono text-[10px] text-muted">
            <span>track</span>
            <span className="text-right">bpm</span>
            <span className="text-right">key</span>
            <span className="text-right">time</span>
          </div>
          {rows.map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-t border-edge/60 px-3 py-2 text-[12px]"
            >
              <span className="truncate">
                {t.artist} &mdash; {t.title}
              </span>
              <span className="text-right font-mono">{t.features.bpm}</span>
              <span className="text-right font-mono text-muted">{t.features.key}</span>
              <span className="text-right font-mono text-muted">{mmss(t.features.durationS)}</span>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-accent/30">
          <div className="bg-accent/10 px-3 py-2 font-mono text-[11px] tracking-[0.14em] text-accent uppercase">
            The same six, tagged
          </div>
          <div className="border-t border-edge/60 bg-background/40 px-3 py-1.5 font-mono text-[10px] text-muted">
            feel &middot; where it goes &middot; what it&rsquo;s for
          </div>
          {rows.map((t) => (
            <div key={t.id} className="border-t border-edge/60 px-3 py-2">
              <div className="truncate text-[12px]">{t.title}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="rounded border border-edge bg-panel px-1.5 py-0.5 font-mono text-[10px] text-muted">
                  energy {t.energy}
                </span>
                {feel(t).map((n) => (
                  <span
                    key={n}
                    className="rounded border border-edge bg-panel px-1.5 py-0.5 text-[10px] text-foreground/80"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Analyze({ library }: { library: Track[] }) {
  // Fixed by default, same as everywhere else. The relative reading is here as
  // a toggle rather than a footnote, because the difference between the two is
  // the most interesting decision in the tagger.
  const [mode, setMode] = useState<"reference" | "library">("reference");
  const relative = useMemo(() => computeThresholds(library), [library]);
  const thresholds = mode === "reference" ? REFERENCE_THRESHOLDS : relative;
  // Four well-known records that land in four different places, so switching
  // shows what the tagger is actually reacting to. Matched by title rather
  // than index so edits to the catalog can't quietly drop one.
  const picks = useMemo(() => {
    const found = DEMO_PICKS.map((d) =>
      library.find((t) => t.title.toLowerCase().includes(d.match.toLowerCase())),
    ).filter((t): t is Track => Boolean(t));
    return found.length >= 2 ? found : library.slice(0, 4);
  }, [library]);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  const track = picks[idx];
  const tagged = useMemo(() => tagTrack(track, thresholds), [track, thresholds]);
  const f = track.features;

  const byGroup = (g: Tag["group"]) => tagged.tags.filter((t) => t.group === g);

  return (
    <Section
      n={5}
      kicker="Tag"
      id="analyze"
      title="A file goes in. Something searchable comes out."
      lede="An audio file by itself is a filename and a waveform. The analyzer reads it and returns numbers; the tagger turns those numbers into words you'd actually type into a search box. Every tag shows the rule that produced it, so you can disagree with it."
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-muted">Compare each track against</span>
        {(
          [
            ["reference", `a fixed ${REFERENCE_CORPUS_SIZE.toLocaleString()}-track reference`],
            ["library", `just these ${library.length} tracks`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
              mode === k
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-edge text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mb-4 max-w-3xl text-[12px] leading-relaxed text-muted">
        {mode === "reference"
          ? "Cutoffs measured once over the full corpus and frozen, so a record tags the same way whatever else sits next to it on disk."
          : "Cutoffs recomputed from these tracks alone. Watch the tags move — the record hasn\u2019t changed, only its neighbours have. That is why this isn\u2019t the default."}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {picks.map((p, i) => (
          <button
            key={p.id}
            onClick={() => {
              setIdx(i);
              setDone(false);
            }}
            className={`rounded-lg border px-3 py-1.5 text-left text-[13px] transition-colors ${
              i === idx ? "border-foreground/40 bg-panel2" : "border-edge text-muted hover:text-foreground"
            }`}
          >
            <span className="block">{p.title}</span>
            <span className="block font-mono text-[10px] text-muted">
              {DEMO_PICKS[i]?.scenario}
            </span>
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
            {(["genre", "vibe", "function", "role"] as const).map((g) => {
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
          <h3 className="text-[14px] font-medium">The bars don&rsquo;t move</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            Cutoffs are measured once over a {REFERENCE_CORPUS_SIZE.toLocaleString()}-track
            corpus and frozen. They used to be percentiles of whatever library was in front of
            the tagger, which sounds reasonable until you notice a record re-tags when its
            neighbours change, and a filtered playlist re-bases every bar against a handful of
            songs. &ldquo;Dark&rdquo; should be a property of the record.
          </p>
        </div>
      </div>

      <LibraryGrid library={library} thresholds={thresholds} />
    </Section>
  );
}

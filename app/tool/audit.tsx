"use client";

import { useMemo, useState } from "react";
import { auditLibrary, ISSUE_LABEL } from "@/lib/library/audit";
import type { IssueKind } from "@/lib/library/audit";
import type { Track } from "@/lib/library/types";
import { STEP_BY_ID } from "@/lib/pipeline/steps";
import { Section } from "../sections/ui";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

export default function Audit({ library }: { library: Track[] }) {
  const issues = useMemo(() => auditLibrary(library), [library]);
  const [filter, setFilter] = useState<IssueKind | "ALL">("ALL");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of issues) c[i.kind] = (c[i.kind] ?? 0) + 1;
    return c;
  }, [issues]);

  const shown = filter === "ALL" ? issues : issues.filter((i) => i.kind === filter);

  return (
    <Section
      n={STEP_BY_ID.check.n}
      id="check"
      kicker="Check"
      title="Find the files that aren't what they say they are"
      lede="When you collect a few hundred tracks at once, some of them are wrong. Not corrupted — wrong. A file named like a three-minute single that's actually a 47-minute festival recording. You find out when you load it, which is the worst possible time."
    >
      <div className="mb-5 rounded-xl border border-edge bg-panel/60 p-5">
        <p className="text-[14px] leading-relaxed text-foreground/80">
          The checks here need nothing but the metadata you already have — no lookups, no
          account, no reference database. They work because{" "}
          <span className="text-accent">a track&rsquo;s title makes a promise about its length</span>.
          &ldquo;Radio Edit&rdquo; promises about three minutes. &ldquo;Extended Mix&rdquo;
          promises six or more. When the file disagrees with its own name, something is
          wrong, and you can see that without knowing anything about the record.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-edge/70 pt-4">
          <span className="font-mono text-2xl">{library.length}</span>
          <span className="text-[13px] text-muted">new files scanned</span>
          <span className="ml-auto font-mono text-2xl text-fail">{issues.length}</span>
          <span className="text-[13px] text-muted">need a look</span>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("ALL")}
          className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
            filter === "ALL" ? "border-foreground/40 bg-panel2" : "border-edge text-muted hover:text-foreground"
          }`}
        >
          All <span className="ml-1 font-mono opacity-60">{issues.length}</span>
        </button>
        {(Object.keys(counts) as IssueKind[]).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
              filter === k ? "border-foreground/40 bg-panel2" : "border-edge text-muted hover:text-foreground"
            }`}
          >
            {ISSUE_LABEL[k]} <span className="ml-1 font-mono opacity-60">{counts[k]}</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {shown.map((i) => (
          <div key={i.track.id + i.kind} className="rounded-xl border border-edge bg-panel/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
              <div className="min-w-0">
                <div className="text-[14px] font-medium">{i.headline}</div>
                <div className="mt-0.5 truncate text-[13px] text-muted">
                  {i.track.artist} — {i.track.title}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-[12px] text-fail">{mmss(i.track.features.durationS)}</span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] ${
                    i.confidence === "high"
                      ? "border-fail/30 bg-fail/10 text-fail"
                      : "border-review/30 bg-review/10 text-review"
                  }`}
                >
                  {i.confidence === "high" ? "clear" : "worth checking"}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{i.detail}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-[13px] leading-relaxed text-muted">
        Nothing is deleted. The point is a short list you can listen through, because the
        cost of a wrong file is paid later, in front of people.
      </p>
    </Section>
  );
}

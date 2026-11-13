import { SOURCES, FUNNEL, OUTCOMES, CRATE, THROUGHPUT } from "@/lib/data/pipeline";
import { Bar, BigStat, Callout, Section } from "./ui";

const KIND_LABEL: Record<string, string> = {
  saved: "saved",
  chart: "chart",
  curated: "curated",
  radio: "artist radio",
};

export function Hero() {
  return (
    <header className="mx-auto w-full max-w-5xl px-5 pb-14 pt-16 sm:px-8 sm:pt-24">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-edge bg-panel px-3 py-1 text-[11px] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Case study · DJ crate preparation
      </div>
      <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
        Building a 470-track crate for a week in the desert
      </h1>
      <p className="mt-5 max-w-2xl text-pretty text-[17px] leading-relaxed text-foreground/75">
        Nine places to dig, one hard deadline, and a dancefloor that notices when you get
        it wrong. This is the whole pipeline — how music gets found, what makes the cut,
        how it gets collected, and the check that keeps the wrong recording out of the set.
      </p>

      <div className="mt-11 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
        <BigStat value={SOURCES.length} label="places music was pulled from" />
        <BigStat value={OUTCOMES.targeted} label="tracks worth going after" />
        <BigStat value={OUTCOMES.playable} label="made it into the crate" tone="text-accent" />
        <BigStat
          value={OUTCOMES.wrongRecordingCaught}
          label="wrong recordings caught before the set"
          tone="text-fail"
        />
      </div>
    </header>
  );
}

export function Funnel() {
  const max = FUNNEL[0].count;
  return (
    <section className="border-t border-edge/60 py-12">
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
        <h2 className="mb-7 font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
          Where it narrows
        </h2>
        <div className="space-y-5">
          {FUNNEL.map((f, i) => (
            <div key={f.stage}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-[15px]">{f.stage}</span>
                <span className="font-mono text-sm text-muted">
                  {f.count.toLocaleString()}
                  {i === 0 && "+"}
                </span>
              </div>
              <Bar value={f.count} max={max} tone={i === FUNNEL.length - 1 ? "pass" : "accent"} />
              <p className="mt-1.5 text-xs text-muted">{f.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Discover() {
  const max = Math.max(...SOURCES.map((s) => s.tracks));
  return (
    <Section
      n={1}
      kicker="Discover"
      title="Nine places the music comes from"
      lede={
        <>
          Charts tell you what&rsquo;s big. Artist radio tells you what sits next to a sound
          you already trust. Curated playlists carry a point of view. And your own saves are
          the only source that knows what you actually reached for. None of them is enough
          alone — so the pipeline reads all nine.
        </>
      }
    >
      <div className="grid gap-2.5 sm:grid-cols-2">
        {SOURCES.map((s) => (
          <div
            key={s.name}
            className="rounded-xl border border-edge bg-panel/60 p-4 transition-colors hover:border-edge/80 hover:bg-panel"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-mono text-[13px]">{s.name}</div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted">
                  {KIND_LABEL[s.kind]}
                </div>
              </div>
              <div className="shrink-0 font-mono text-lg">{s.tracks}</div>
            </div>
            <div className="mt-3">
              <Bar value={s.tracks} max={max} />
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{s.blurb}</p>
          </div>
        ))}
      </div>

      <Callout>
        Those counts add up to more than the 491 candidates, because a track can surface in
        several places at once. <strong className="text-foreground">That overlap is the
        most valuable signal in the whole pipeline.</strong> One algorithmic playlist
        recommending something is a guess. Two unrelated sources agreeing is evidence — and
        it becomes the top tier of the rubric in the next step.
      </Callout>
    </Section>
  );
}

export function Reconcile() {
  return (
    <Section
      n={2}
      kicker="Reconcile"
      title="Most of what you find, you already own"
      lede="Nine sources with heavy overlap produce an enormous amount of noise. Before deciding what's worth acquiring, the list gets checked against the library that already exists — matched on recording identity, not on title, because the same title is routinely a different recording."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { v: "~1,200", l: "raw candidates across all nine sources", t: "" },
          { v: "491", l: "genuinely new after removing what I own", t: "text-accent" },
          { v: CRATE.titleCollisions, l: "share a title with a different recording", t: "text-review" },
        ].map((x) => (
          <div key={x.l} className="rounded-xl border border-edge bg-panel/60 p-5">
            <div className={`font-mono text-2xl ${x.t}`}>{x.v}</div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{x.l}</p>
          </div>
        ))}
      </div>
      <Callout>
        Those {CRATE.titleCollisions} title collisions are the reason this step can&rsquo;t
        be a name match. &ldquo;The Future&rdquo; exists as a 3:07 single and as a 7:29
        extended mix. They are not interchangeable in a set, and treating them as the same
        row either loses a track you wanted or quietly swaps one for the other.
      </Callout>
    </Section>
  );
}

export function Acquire() {
  return (
    <Section
      n={4}
      kicker="Acquire"
      title="The first approach failed on two thirds of the list"
      lede="Collecting 491 files sounds like a volume problem. It wasn't. Getting this wrong cost a full day, and the fix only became obvious once the constraint was named correctly."
    >
      <div className="space-y-3">
        {THROUGHPUT.map((t, i) => {
          const rate = t.of ? Math.round((t.recovered / t.of) * 100) : 0;
          return (
            <div
              key={t.attempt}
              className={`rounded-xl border p-5 ${
                i === THROUGHPUT.length - 1
                  ? "border-pass/30 bg-pass/[0.06]"
                  : "border-edge bg-panel/60"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-[15px] font-medium">
                  <span className="mr-2 font-mono text-xs text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {t.attempt}
                </span>
                <span
                  className={`font-mono text-sm ${
                    rate === 0 ? "text-fail" : rate > 50 ? "text-pass" : "text-review"
                  }`}
                >
                  {t.recovered}/{t.of} · {rate}%
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{t.insight}</p>
            </div>
          );
        })}
      </div>
      <Callout>
        The second row is the useful one. Retrying harder, then waiting four hours and
        retrying again, both recovered exactly zero.{" "}
        <strong className="text-foreground">
          The limit was how fast requests arrived, not how many had been sent
        </strong>{" "}
        — so patience was never going to be the lever. Splitting the same work into small,
        paced waves recovered two thirds of the backlog on the next attempt.
      </Callout>
    </Section>
  );
}

export function Crate() {
  const eraMax = Math.max(...CRATE.byEra.map((e) => e.tracks));
  const verMax = Math.max(...CRATE.byVersion.map((v) => v.tracks));
  return (
    <Section
      n={6}
      kicker="Crate"
      title="What ended up in the box"
      lede="470 tracks that are what they say they are. A crate isn't a playlist — it's raw material for a set that hasn't been planned yet, so it needs range: openers, peaks, comedowns, and enough length to mix out of."
    >
      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h3 className="mb-4 font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            By era
          </h3>
          <div className="space-y-3.5">
            {CRATE.byEra.map((e) => (
              <div key={e.era}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-sm">{e.era}</span>
                  <span className="font-mono text-xs text-muted">{e.tracks}</span>
                </div>
                <Bar value={e.tracks} max={eraMax} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-muted">
            Weighted to the last two years, but nearly a quarter predates 2020. New music
            keeps a set current; older records are what a floor already knows.
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            By version
          </h3>
          <div className="space-y-3.5">
            {CRATE.byVersion.map((v) => (
              <div key={v.version}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-sm">{v.version}</span>
                  <span className="font-mono text-xs text-muted">{v.tracks}</span>
                </div>
                <Bar value={v.tracks} max={verMax} tone="muted" />
                <p className="mt-1 text-xs text-muted">{v.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-9 grid grid-cols-3 gap-4 rounded-xl border border-edge bg-panel/60 p-5">
        <BigStat value={CRATE.shortest} label="shortest track" />
        <BigStat value={CRATE.median} label="median" />
        <BigStat value={CRATE.longest} label="longest" />
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        That spread — 2:10 to 11:25 — is also why the quality check in the previous step
        can&rsquo;t use one percentage tolerance for everything. Five percent of an
        eleven-minute track is thirty-three seconds, which is wide enough to let an entirely
        different edit through.
      </p>
    </Section>
  );
}

export function Closing() {
  return (
    <Section
      kicker="Takeaways"
      title="What I'd carry into the next one"
      lede="Three things generalised past music."
    >
      <div className="space-y-3">
        {[
          {
            h: "A metric that can't go down isn't measuring anything",
            b: "One recovery pass reported 177 of 177 succeeded. It hadn't — the real number was 169. The counter measured a field the process filled in before doing any work, so it was structurally incapable of reporting failure. It only surfaced because a file count disagreed with it. Now the count comes from completed writes, which can't be faked ahead of time.",
          },
          {
            h: "Name the constraint before optimising against it",
            b: "Two full retry cycles recovered nothing because the problem looked like volume and was actually rate. Hours went into waiting, which was the one lever guaranteed not to work.",
          },
          {
            h: "'Unverified' and 'wrong' need separate buckets",
            b: "Collapsing them forces a bad trade: trust everything and ship errors, or reject everything and bury the real failures where nobody reads them. A third bucket kept the strict checks affordable — it stayed around 7% of the catalogue, small enough to actually listen through.",
          },
        ].map((x) => (
          <div key={x.h} className="rounded-xl border border-edge bg-panel/60 p-5">
            <h3 className="text-[15px] font-medium">{x.h}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{x.b}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-edge bg-panel/40 p-5 text-[13px] leading-relaxed text-muted">
        <p>
          <strong className="text-foreground/80">About the data on this page.</strong> The
          structure is real: the nine sources, the priority tiers, the funnel counts, the
          throughput numbers and the outcomes all come from an actual run. Individual track
          titles and artists are generated, so nothing here publishes a personal library.
          The quality check in step 5 is real working code — the same module the page runs
          in your browser is the one covered by the test suite.
        </p>
        <p className="mt-3">
          This project validates a collection; it does not acquire one. How files are
          obtained sits behind an interface whose only implementation here is a stand-in.
        </p>
      </div>
    </Section>
  );
}

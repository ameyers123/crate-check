import { Section } from "../sections/ui";

export function Hero({ trackCount }: { trackCount: number }) {
  return (
    <header className="mx-auto w-full max-w-6xl px-5 pb-12 pt-16 sm:px-8 sm:pt-20">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-edge bg-panel px-3 py-1 text-[11px] text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Working demo · {trackCount} sample tracks
      </div>
      <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
        Your DJ library knows BPM and key. It has no idea how anything feels.
      </h1>
      <p className="mt-5 max-w-2xl text-pretty text-[17px] leading-relaxed text-foreground/75">
        So you can&rsquo;t ask it for a hypnotic track around 126, or for something to open
        with. crate-check analyzes each file, tags it with genre, feel and where it belongs
        in a night, and hands the result back to Rekordbox. Everything below runs on sample
        data in your browser.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="#analyze"
          className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-[14px] font-medium text-accent transition-colors hover:bg-accent/20"
        >
          See a track get tagged →
        </a>
        <a
          href="https://github.com/ameyers123/crate-check"
          className="rounded-lg border border-edge px-4 py-2 text-[14px] transition-colors hover:bg-panel2"
        >
          Source on GitHub
        </a>
      </div>
    </header>
  );
}

export function Find() {
  const sources = [
    { k: "Your saves", d: "Tracks you reacted to at some point. The only source that reflects your taste directly." },
    { k: "Genre charts", d: "What's current in a genre. Good for recency, weak on fit." },
    { k: "Curated playlists", d: "Someone else's point of view. Strong signal when you trust the curator." },
    { k: "Artist radio", d: "What sits next to a sound you already like. Good for finding adjacent records." },
  ];
  return (
    <Section
      n={1}
      id="find"
      kicker="Find"
      title="Deciding what to look for"
      lede="Four kinds of source, each good at something different. None of them is enough alone, and a track showing up in two of them at once is the strongest signal you get for free."
    >
      <div className="grid gap-2.5 sm:grid-cols-2">
        {sources.map((s) => (
          <div key={s.k} className="rounded-xl border border-edge bg-panel/60 p-4">
            <div className="text-[14px] font-medium">{s.k}</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.d}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[13px] leading-relaxed text-muted">
        This step happens outside the tool — in whatever you already use to listen. What
        matters downstream is that you end up with a list of tracks you want.
      </p>
    </Section>
  );
}

export function Collect() {
  return (
    <Section
      n={2}
      id="collect"
      kicker="Collect"
      title="Getting the files"
      lede="Also outside the tool, and deliberately so. crate-check never fetches anything — it starts once files exist on your disk."
    >
      <details className="group rounded-xl border border-edge bg-panel/60">
        <summary className="cursor-pointer list-none px-5 py-4 text-[14px] font-medium transition-colors hover:bg-panel2">
          <span className="mr-2 inline-block text-muted transition-transform group-open:rotate-90">
            ›
          </span>
          Where DJs actually get files
        </summary>
        <div className="space-y-4 border-t border-edge/70 px-5 py-5 text-[13px] leading-relaxed text-muted">
          <p>
            Most libraries are assembled from the same handful of places: stores that sell
            lossless downloads to DJs, artist and label pages that sell or give away tracks
            directly, promo pools that service DJs with new releases, subscription services
            with offline locker features intended for performance, and the files you already
            own and ripped yourself.
          </p>
          <p>
            There is also a long tail of open-source command-line tooling for pulling audio
            from the open web. Those tools are legitimate software with legitimate uses —
            archiving material you created, downloading openly licensed work, saving things
            an artist has put out for free. They do not change what you are entitled to.
          </p>
          <p className="rounded-lg border border-review/25 bg-review/[0.07] px-4 py-3 text-foreground/80">
            Worth being plain about: whether a given download is OK depends entirely on the
            rights to that specific recording and the terms of the service hosting it, not
            on which tool you used.{" "}
            <strong className="text-foreground">
              Collect from sources you&rsquo;re actually entitled to
            </strong>{" "}
            — things you bought, were serviced, were given, or made. That&rsquo;s a decision
            for you, which is part of why it sits outside this tool rather than inside it.
          </p>
          <p>
            The practical lesson from doing this at volume: fetch slowly. Most sources throttle
            sustained automated traffic, and the failure mode looks like a broken tool rather
            than a rate limit. Small batches with pauses finish; one big run usually
            doesn&rsquo;t.
          </p>
        </div>
      </details>
    </Section>
  );
}

export function Export() {
  return (
    <Section
      n={6}
      id="export"
      kicker="Export"
      title="Hand it back to Rekordbox"
      lede="The tags are only worth anything if they're there when you're playing. They get written into the standard metadata fields DJ software already reads, so they show up in Rekordbox and on a CDJ without anything extra installed."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-edge bg-panel/60 p-5">
          <h3 className="text-[14px] font-medium">What gets written</h3>
          <div className="mt-3 space-y-2 font-mono text-[12px]">
            {[
              ["Comment", "Deep House / Relaxed / Warm-up"],
              ["Grouping", "Warm-up"],
              ["Genre", "Deep House"],
            ].map(([field, value]) => (
              <div key={field} className="flex gap-3">
                <span className="w-20 shrink-0 text-muted">{field}</span>
                <span className="text-foreground/85">{value}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-muted">
            Standard ID3 fields. Nothing proprietary, nothing that breaks if you stop using
            this.
          </p>
        </div>
        <div className="rounded-xl border border-edge bg-panel/60 p-5">
          <h3 className="text-[14px] font-medium">Why it matters on the CDJ</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Searching a USB mid-set is slow and you are doing it under pressure. Typing
            &ldquo;Peak&rdquo; and getting the 19 tracks that actually work there is a
            different experience from scrolling 3,000 filenames trying to remember which one
            you meant.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            It also survives the trip: because the tags live in the file, they&rsquo;re on
            the USB stick in the booth, not in an app on your laptop at home.
          </p>
        </div>
      </div>
    </Section>
  );
}

export function Closing() {
  return (
    <Section
      kicker="About"
      title="What this is"
      lede="A personal project, built because the existing tools each do one piece and none of them talk to each other."
    >
      <div className="space-y-3">
        <div className="rounded-xl border border-edge bg-panel/60 p-5 text-[13px] leading-relaxed text-muted">
          <p>
            Rekordbox manages the library and plays it. Lexicon cleans up metadata. Mixed In
            Key does key and energy. None of them can answer &ldquo;what should I open
            with&rdquo; or &ldquo;give me something hypnotic at 126&rdquo;, because none of
            them tag how a record feels or where it sits in a night. This fills that gap and
            then gets out of the way.
          </p>
          <p className="mt-3">
            The tagging approach came out of running audio analysis over a real 3,000-track
            library: a vocabulary of overlapping genre, vibe and function tags, with
            thresholds set as percentiles of the library itself rather than fixed constants,
            and a recorded reason for every tag so a wrong one can be argued with.
          </p>
        </div>
        <div className="rounded-xl border border-edge bg-panel/40 p-5 text-[13px] leading-relaxed text-muted">
          <p>
            <strong className="text-foreground/80">About the data here.</strong> The sample
            library is generated — invented artists and titles, with audio features shaped to
            match how a real house and techno collection is distributed. The tagging rules,
            the thresholds and the audit checks are the real implementation, running live in
            your browser. No files are uploaded and no personal library is published.
          </p>
        </div>
      </div>
    </Section>
  );
}

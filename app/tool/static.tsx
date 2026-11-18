import { ENGINE_AS_OF, ENGINE_STATUS_LABEL, STEP_BY_ID } from "@/lib/pipeline/steps";
import type { StepId } from "@/lib/pipeline/steps";
import { Section } from "../sections/ui";

/**
 * What the engine behind this demo does at a step, and how far it has got.
 * Used by the sections for steps the demo itself doesn't run.
 */
function EngineNote({ step }: { step: StepId }) {
  const e = STEP_BY_ID[step].engine;
  if (!e) return null;
  return (
    <div className="mt-4 rounded-xl border border-edge bg-panel/40 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
          In the engine behind this demo
        </h3>
        <span className="rounded border border-edge px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
          {ENGINE_STATUS_LABEL[e.status]}
        </span>
        <span className="ml-auto font-mono text-[11px] text-muted">as of {ENGINE_AS_OF}</span>
      </div>
      <p className="mt-2.5 max-w-3xl text-[13px] leading-relaxed text-foreground/80">{e.does}</p>
      {e.open && <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted">{e.open}</p>}
    </div>
  );
}

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
      n={STEP_BY_ID.find.n}
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
      <EngineNote step="find" />
    </Section>
  );
}

export function Match() {
  const sorts = [
    {
      k: "Owned",
      d: "The song is in the library, as the same recording. Nothing to collect.",
    },
    {
      k: "Needs a look",
      d: "Something close is there: you have the remix and the list says the original. Flagged for you to decide, never swapped in.",
    },
    {
      k: "Missing",
      d: "Nothing in the library matches. This is the only list worth collecting from.",
    },
  ];
  return (
    <Section
      n={STEP_BY_ID.match.n}
      id="match"
      kicker="Match"
      title="Before you collect anything, find out what you already own"
      lede="A want list is a list of songs. Your library is a pile of files with spellings of its own. Matching is how the first becomes a short list of what is actually missing, and it is the step that stops you from owning the same record twice."
    >
      <div className="grid gap-2.5 sm:grid-cols-3">
        {sorts.map((s) => (
          <div key={s.k} className="rounded-xl border border-edge bg-panel/60 p-4">
            <div className="text-[14px] font-medium">{s.k}</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.d}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 max-w-3xl text-[13px] leading-relaxed text-muted">
        Most of the work is spelling. &ldquo;Callaíta&rdquo; and &ldquo;Callaita&rdquo; are one
        song; &ldquo;A ft. B&rdquo; is two artists, not one called that. A matcher that misses
        those makes owned songs look missing, and you collect them again. This step happens in
        the engine behind this demo, not in the browser.
      </p>
      <EngineNote step="match" />
    </Section>
  );
}

export function Collect() {
  return (
    <Section
      n={STEP_BY_ID.collect.n}
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
      <EngineNote step="collect" />
    </Section>
  );
}

export function Library() {
  const rules = [
    { k: "Skips what you already have", d: "A song that is already in the library isn't copied in again." },
    { k: "Near-matches wait for you", d: "A close call, such as a different mix of the same song, goes to a review folder instead of straight in." },
    { k: "Never overwrites, never moves", d: "The original stays where it was, and nothing already in the library is replaced." },
    { k: "Remembers where each file came from", d: "So a wrong one can be traced back to the batch that brought it in." },
  ];
  return (
    <Section
      n={STEP_BY_ID.library.n}
      id="library"
      kicker="Library"
      title="One safe door into the place your music lives"
      lede="Playlists don't hold music, they point at it. That makes the library the one folder where a wrong file does damage everywhere, so getting a file in is a step with rules, not a drag and drop."
    >
      <div className="grid gap-2.5 sm:grid-cols-2">
        {rules.map((r) => (
          <div key={r.k} className="rounded-xl border border-edge bg-panel/60 p-4">
            <div className="text-[14px] font-medium">{r.k}</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{r.d}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 max-w-3xl text-[13px] leading-relaxed text-muted">
        It is a dry run unless you say to apply, so you see what would be copied first. Once new
        files are in, matching runs again so the next playlist picks them up in order.
      </p>
      <EngineNote step="library" />
    </Section>
  );
}

export function Import() {
  return (
    <Section
      n={STEP_BY_ID.import.n}
      id="import"
      kicker="Import"
      title="Get them into Rekordbox in the order you meant"
      lede="Rekordbox is the first place the tracks stop being files and become a library: it reads them, analyzes them and holds your playlists. The cheapest way to get a hundred songs in, in order, is one playlist file."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-edge bg-panel/60 p-5">
          <h3 className="text-[14px] font-medium">What gets written</h3>
          <div className="mt-3 space-y-2 font-mono text-[12px]">
            {[
              ["XML", "a Rekordbox playlist, in order"],
              ["M3U8", "the same, for anything else"],
              ["Missing", "what the list wanted and you don't have"],
            ].map(([field, value]) => (
              <div key={field} className="flex gap-3">
                <span className="w-20 shrink-0 text-muted">{field}</span>
                <span className="text-foreground/85">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-edge bg-panel/60 p-5">
          <h3 className="text-[14px] font-medium">What you do</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Import either file in Rekordbox, then let it analyze the new tracks. Without the
            playlist file you can still drop the files in loose and order them by hand. That is
            fine for ten tracks and slow for a hundred.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            Nothing here edits Rekordbox&rsquo;s database. It imports a file you hand it, the
            way it would from anyone.
          </p>
        </div>
      </div>
      <EngineNote step="import" />
    </Section>
  );
}

export function Crates() {
  const kinds = [
    { k: "Genre", d: "House, Techno, Disco and the rest of the genre tags." },
    { k: "Vibe", d: "A handful of feels: the ones you would actually ask for." },
    { k: "Set function", d: "Warm-up, driving, peak, afterhours." },
    { k: "Combinations", d: "Tech House · Driving. Where two tags meet is usually what you are after." },
  ];
  return (
    <Section
      n={STEP_BY_ID.crates.n}
      id="crates"
      kicker="Crates"
      title="Tags are only useful in the booth if you can open them"
      lede="A tag on a track is a search you hope to have time for. A crate is the same tag already turned into a folder on the CDJ, so mid-set you open one instead of scrolling a few thousand records."
    >
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {kinds.map((k) => (
          <div key={k.k} className="rounded-xl border border-edge bg-panel/60 p-4">
            <div className="text-[14px] font-medium">{k.k}</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{k.d}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 max-w-3xl text-[13px] leading-relaxed text-muted">
        Optional, and the least finished step on this page. Without crates you browse by playlist
        and filename, which works, and is what the set-building step further down shortens.
      </p>
      <EngineNote step="crates" />
    </Section>
  );
}

export function Export() {
  return (
    <Section
      n={STEP_BY_ID.export.n}
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
            Finding a record on a USB mid-set is slow and you&rsquo;re doing it under
            pressure. The reliable route from a tag to the booth is a playlist: build
            &ldquo;Peak&rdquo;, &ldquo;Warm-up&rdquo; and &ldquo;Floor Savers&rdquo; playlists
            in Rekordbox from the tags before you export, and on the CDJ they&rsquo;re folders
            you open rather than searches you hope will work.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            It also survives the trip: because the tags live in the file, they&rsquo;re on
            the USB stick in the booth, not in an app on your laptop at home.
          </p>
        </div>
      </div>
      <EngineNote step="export" />
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
            <strong className="text-foreground/80">The engine behind it.</strong> This page is
            the public demo. Behind it is crate-engine, a private command-line tool that runs
            the same ideas against a real library: matching a want list against the files you
            own, adding new files safely, writing ordered playlists for Rekordbox and reading
            Rekordbox&rsquo;s analysis from a copy. The map at the top is its step map. The
            &ldquo;in the engine&rdquo; notes say how far each step has actually got, including
            the steps that aren&rsquo;t built.
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

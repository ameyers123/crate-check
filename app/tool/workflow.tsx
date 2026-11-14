"use client";

export const STEPS = [
  { id: "find", n: 1, name: "Find", sub: "Decide what to look for", tool: false },
  { id: "collect", n: 2, name: "Collect", sub: "Get the files", tool: false },
  { id: "check", n: 3, name: "Check", sub: "Are they what they claim?", tool: true },
  { id: "analyze", n: 4, name: "Analyze & tag", sub: "Read the audio, label it", tool: true },
  { id: "build", n: 5, name: "Build", sub: "Search by feel, plan a set", tool: true },
  { id: "export", n: 6, name: "Export", sub: "Back into Rekordbox", tool: true },
] as const;

export default function Workflow() {
  return (
    <section className="border-y border-edge/60 bg-panel/30 py-10">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2">
          <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            How a DJ gets from &ldquo;I heard a track&rdquo; to playing it
          </h2>
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="h-2 w-2 rounded-sm bg-accent" /> this tool
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="h-2 w-2 rounded-sm bg-edge" /> you, elsewhere
          </span>
        </div>

        <ol className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {STEPS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={`block h-full rounded-xl border p-3.5 transition-colors ${
                  s.tool
                    ? "border-accent/35 bg-accent/[0.07] hover:border-accent/60"
                    : "border-edge bg-panel/50 hover:border-edge/90"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] ${s.tool ? "text-accent" : "text-muted"}`}
                  >
                    {String(s.n).padStart(2, "0")}
                  </span>
                  <span className="text-[14px] font-medium">{s.name}</span>
                </div>
                <p className="mt-1.5 text-[12px] leading-snug text-muted">{s.sub}</p>
              </a>
            </li>
          ))}
        </ol>

        <p className="mt-5 max-w-3xl text-[13px] leading-relaxed text-muted">
          Steps 3 to 6 are normally split across Rekordbox, Lexicon, Mixed In Key and a
          spreadsheet. This does them in one place and hands the result back to Rekordbox,
          so you keep organising and playing where you already do.
        </p>
      </div>
    </section>
  );
}

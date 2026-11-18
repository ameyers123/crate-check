import { ENGINE_AS_OF, ENGINE_PHASES, ENGINE_RULES } from "@/lib/pipeline/steps";
import type { PhaseStatus } from "@/lib/pipeline/steps";

const PHASE_STYLE: Record<PhaseStatus, string> = {
  done: "border-pass/40 text-pass",
  "in progress": "border-accent/45 text-accent",
  "not started": "border-edge text-muted",
};

/**
 * The engine's build plan, phase by phase, and the rules it keeps. It sits
 * under the pipeline map rather than beside it: the map says what each step
 * is, this says how much of the engine behind it exists.
 */
export default function EnginePhases() {
  return (
    <details className="group mt-8 rounded-xl border border-edge bg-panel/50">
      <summary className="cursor-pointer list-none px-5 py-4 transition-colors hover:bg-panel2">
        <span className="mr-2 inline-block text-muted transition-transform group-open:rotate-90">
          ›
        </span>
        <span className="text-[14px] font-medium">Where the engine is, phase by phase</span>
        <span className="ml-3 font-mono text-[11px] text-muted">as of {ENGINE_AS_OF}</span>
      </summary>

      <div className="border-t border-edge/70 px-5 py-5">
        <p className="max-w-3xl text-[13px] leading-relaxed text-muted">
          crate-engine is the private tool behind this demo. The &ldquo;in the engine&rdquo;
          notes above say how far each step has got; this is the order the rest gets built in.
          It is a snapshot, and it will go stale.
        </p>

        <ol className="mt-5 grid gap-3 lg:grid-cols-2">
          {ENGINE_PHASES.map((p) => (
            <li key={p.n} className="rounded-xl border border-edge/80 bg-background/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-muted">PHASE {p.n}</span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${PHASE_STYLE[p.status]}`}
                >
                  {p.status}
                </span>
              </div>
              <h3 className="mt-1.5 text-[15px] font-medium">{p.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/80">{p.goal}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">{p.why}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                <span className="text-foreground/70">Done when:</span> {p.done}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-5 rounded-xl border border-accent/25 bg-accent/[0.06] p-4">
          <h3 className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
            Rules the engine keeps
          </h3>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-foreground/80">
            {ENGINE_RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

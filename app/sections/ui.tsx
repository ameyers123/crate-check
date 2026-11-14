import type { ReactNode } from "react";

export function Section({
  n,
  id,
  kicker,
  title,
  lede,
  children,
}: {
  n?: number;
  id?: string;
  kicker: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-4 border-t border-edge/60 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="mb-9 max-w-2xl">
          <div className="mb-3 flex items-center gap-2.5">
            {n !== undefined && (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 font-mono text-[11px] text-accent">
                {n}
              </span>
            )}
            <span className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
              {kicker}
            </span>
          </div>
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-[28px]">
            {title}
          </h2>
          {lede && (
            <p className="mt-3.5 text-pretty text-[15px] leading-relaxed text-foreground/70">
              {lede}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export function Bar({
  value,
  max,
  tone = "accent",
}: {
  value: number;
  max: number;
  tone?: "accent" | "pass" | "fail" | "muted";
}) {
  const color =
    tone === "pass" ? "bg-pass" : tone === "fail" ? "bg-fail" : tone === "muted" ? "bg-edge" : "bg-accent";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-edge/70">
      <div
        className={`h-full rounded-full ${color} transition-[width] duration-500`}
        style={{ width: `${max ? Math.max((value / max) * 100, 1.5) : 0}%` }}
      />
    </div>
  );
}

export function BigStat({
  value,
  label,
  tone,
}: {
  value: string | number;
  label: string;
  tone?: string;
}) {
  return (
    <div>
      <div className={`font-mono text-3xl sm:text-4xl ${tone ?? ""}`}>{value}</div>
      <div className="mt-1.5 text-xs leading-snug text-muted">{label}</div>
    </div>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="mt-8 rounded-xl border border-accent/25 bg-accent/[0.07] px-5 py-4 text-[14px] leading-relaxed text-foreground/85">
      {children}
    </div>
  );
}

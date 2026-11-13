import catalog from "@/lib/data/catalog.json";
import type { CatalogEntry } from "@/lib/data/generate-catalog";
import {
  Acquire,
  Closing,
  Crate,
  Discover,
  Funnel,
  Hero,
  Reconcile,
} from "./sections/static-sections";
import Prioritize from "./sections/prioritize";
import Verify from "./sections/verify";

export default function Home() {
  const entries = catalog as CatalogEntry[];
  return (
    <main className="pb-24">
      <Hero />
      <Funnel />
      <Discover />
      <Reconcile />
      <Prioritize />
      <Acquire />
      <Verify entries={entries} />
      <Crate />
      <Closing />
      <footer className="mx-auto w-full max-w-5xl px-5 pt-4 text-xs text-muted sm:px-8">
        <a
          href="https://github.com/ameyers123/crate-check"
          className="underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Source on GitHub
        </a>
      </footer>
    </main>
  );
}

import Playground from "./playground";
import catalog from "@/lib/data/catalog.json";
import type { CatalogEntry } from "@/lib/data/generate-catalog";

export default function Home() {
  return <Playground entries={catalog as CatalogEntry[]} />;
}

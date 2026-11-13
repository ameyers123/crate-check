/**
 * Rebuild the committed synthetic catalog.
 *
 *   npm run generate
 *
 * Output is deterministic for a given seed, so the committed JSON and a fresh
 * run of this script always agree.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { generateCatalog } from "../lib/data/generate-catalog";

const entries = generateCatalog();
const outDir = join(process.cwd(), "lib", "data");
mkdirSync(outDir, { recursive: true });

const outFile = join(outDir, "catalog.json");
writeFileSync(outFile, JSON.stringify(entries, null, 2) + "\n", "utf8");

const counts = entries.reduce<Record<string, number>>((acc, e) => {
  acc[e.scenario] = (acc[e.scenario] ?? 0) + 1;
  return acc;
}, {});

console.log(`wrote ${entries.length} entries -> lib/data/catalog.json`);
for (const [scenario, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}  ${scenario}`);
}

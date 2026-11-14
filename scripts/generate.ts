/**
 * Rebuild the committed sample library.
 *
 *   npm run generate
 *
 * Deterministic for a given seed: the committed JSON and a fresh run agree.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { generateLibrary } from "../lib/library/generate";
import { tagLibrary } from "../lib/library/tagger";
import { auditLibrary } from "../lib/library/audit";

const tracks = generateLibrary();
const { tracks: tagged } = tagLibrary(tracks);
const issues = auditLibrary(tracks);

const outDir = join(process.cwd(), "lib", "library");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "sample.json"), JSON.stringify(tracks, null, 2) + "\n", "utf8");

const counts: Record<string, number> = {};
for (const t of tagged) for (const tag of t.tags) counts[tag.name] = (counts[tag.name] ?? 0) + 1;

console.log(`wrote ${tracks.length} tracks -> lib/library/sample.json`);
console.log(`\ntag coverage:`);
for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(4)}  ${k}  (${Math.round((v / tracks.length) * 100)}%)`);
}
console.log(`\naudit found ${issues.length} issues:`);
const ic: Record<string, number> = {};
for (const i of issues) ic[i.kind] = (ic[i.kind] ?? 0) + 1;
for (const [k, v] of Object.entries(ic)) console.log(`  ${String(v).padStart(4)}  ${k}`);

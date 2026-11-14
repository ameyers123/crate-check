/**
 * Rebuild committed demo data.
 *
 *   npm run generate
 *
 * Two outputs:
 *   library.json  — the real catalog (43 known records), tagged
 *   incoming.json — a synthetic batch of freshly-collected files for the
 *                   Check stage, with defects planted
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildCatalog } from "../lib/library/build-catalog";
import { generateLibrary } from "../lib/library/generate";
import { tagLibrary } from "../lib/library/tagger";
import { auditLibrary } from "../lib/library/audit";
import { SET_SHAPES, planSet } from "../lib/library/setshapes";

const out = join(process.cwd(), "lib", "library");

const library = buildCatalog();
writeFileSync(join(out, "library.json"), JSON.stringify(library, null, 2) + "\n", "utf8");

const incoming = generateLibrary(90210, 30);
writeFileSync(join(out, "incoming.json"), JSON.stringify(incoming, null, 2) + "\n", "utf8");

const { tracks: tagged } = tagLibrary(library);
console.log(`library.json   ${library.length} real tracks`);
console.log(`incoming.json  ${incoming.length} synthetic files, ${auditLibrary(incoming).length} with issues\n`);

const counts: Record<string, number> = {};
for (const t of tagged) for (const tag of t.tags) counts[tag.name] = (counts[tag.name] ?? 0) + 1;
console.log("tag coverage:");
for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(3)}  ${k}`);
}

console.log(`\nenergy spread: ${tagged.map((t) => t.energy).sort((a, b) => a - b).join(" ")}`);
console.log("\nset shapes:");
for (const s of SET_SHAPES) {
  const plan = planSet(s, tagged);
  console.log(`  ${s.name.padEnd(22)} ${plan.map((p) => p.track.energy).join("→")}  (${plan.length} slots)`);
}

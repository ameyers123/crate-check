/**
 * Run the validation engine over the synthetic catalog and print a report.
 *
 *   npm run verify
 *   npm run verify -- --tolerance 20
 *   npm run verify -- --no-near-exact-downgrade
 *   npm run verify -- --list FAIL
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_RULES, tally, validateAll } from "../lib/engine";
import type { RuleConfig, ValidatedPairing } from "../lib/engine";
import type { CatalogEntry } from "../lib/data/generate-catalog";

function parseArgs(argv: string[]): { config: RuleConfig; list: string | null } {
  const config: RuleConfig = { ...DEFAULT_RULES };
  let list: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--tolerance") config.toleranceS = Number(argv[++i]);
    else if (a === "--no-duration-gate") config.durationGate = false;
    else if (a === "--no-disqualifying-tokens") config.disqualifyingTokens = false;
    else if (a === "--no-version-rules") config.versionRules = false;
    else if (a === "--no-original-mix-synonym") config.originalMixSynonym = false;
    else if (a === "--no-near-exact-downgrade") config.nearExactDowngrade = false;
    else if (a === "--list") list = (argv[++i] ?? "FAIL").toUpperCase();
  }
  return { config, list };
}

const entries: CatalogEntry[] = JSON.parse(
  readFileSync(join(process.cwd(), "lib", "data", "catalog.json"), "utf8"),
);

const { config, list } = parseArgs(process.argv.slice(2));
const results = validateAll(
  entries.map((e) => ({ track: e.track, candidate: e.candidate })),
  config,
);
const counts = tally(results);

const pct = (n: number) => `${((n / counts.total) * 100).toFixed(1)}%`;

console.log(`\ncrate-check — ${counts.total} tracks, tolerance ±${config.toleranceS}s\n`);
console.log(`  PASS    ${String(counts.PASS).padStart(4)}  ${pct(counts.PASS)}`);
console.log(`  REVIEW  ${String(counts.REVIEW).padStart(4)}  ${pct(counts.REVIEW)}`);
console.log(`  FAIL    ${String(counts.FAIL).padStart(4)}  ${pct(counts.FAIL)}`);

const byCode = results.reduce<Record<string, number>>((acc, r) => {
  acc[r.verdict.code] = (acc[r.verdict.code] ?? 0) + 1;
  return acc;
}, {});
console.log("\n  by code:");
for (const [code, n] of Object.entries(byCode).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(4)}  ${code}`);
}

if (list) {
  const shown = results.filter((r: ValidatedPairing) => r.verdict.status === list);
  console.log(`\n  ${list} (${shown.length}):\n`);
  for (const r of shown) {
    console.log(`    ${r.track.artist} — ${r.track.title}`);
    console.log(`      ${r.verdict.reasons.join(" | ")}`);
  }
}
console.log();

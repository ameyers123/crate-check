/**
 * Minimal fuzzy string matching — a dependency-free stand-in for the
 * `partial_ratio` used in the original Python implementation.
 *
 * Scores are 0-100. Kept deliberately small: the engine only uses fuzzy
 * matching to decide between REVIEW and FAIL, never to decide PASS, so an
 * approximate score is sufficient and a heavyweight dependency is not worth it.
 */

/** Standard Levenshtein edit distance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Similarity of two whole strings, 0-100. */
export function ratio(a: string, b: string): number {
  if (!a && !b) return 100;
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  return Math.round((1 - levenshtein(a, b) / maxLen) * 100);
}

/**
 * Best similarity between `needle` and any equal-length window of `haystack`.
 *
 * Answers "does this short string appear, approximately, somewhere in this
 * longer one" — the right question for "is the remixer named in this title".
 */
export function partialRatio(needle: string, haystack: string): number {
  if (!needle || !haystack) return 0;
  if (needle.length > haystack.length) return partialRatio(haystack, needle);
  if (haystack.includes(needle)) return 100;

  let best = 0;
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    const score = ratio(needle, haystack.slice(i, i + needle.length));
    if (score > best) best = score;
    if (best === 100) break;
  }
  return best;
}

/** Order-insensitive token similarity, for loose artist/title sanity checks. */
export function tokenSetRatio(a: string, b: string): number {
  const norm = (s: string) =>
    [...new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean))].sort().join(" ");
  return ratio(norm(a), norm(b));
}

/**
 * Controlled vocabularies for version semantics.
 *
 * These lists are deliberately small and hand-curated. Every entry earned its
 * place by appearing in a real mismatch; this is not an attempt to enumerate
 * every way a title can be written.
 */

/**
 * Tokens that mean "this is categorically not the recording you asked for".
 *
 * If one of these appears in the source's title but NOT in the catalog title,
 * the candidate is contradicted outright. An acapella or a live cut can share
 * an artist, a title, and even a plausible runtime with the studio master and
 * still be useless in a set.
 */
export const DISQUALIFYING_TOKENS = [
  "sped up",
  "nightcore",
  "slowed",
  "reverb",
  "8d audio",
  "8d",
  "live",
  "karaoke",
  "cover",
  "instrumental",
  "acapella",
  "acappella",
  "bootleg",
  "vip mix",
  "vip",
] as const;

/**
 * Tokens that assert *some* specific version.
 *
 * Used to detect contradiction: if the catalog wants the original and the
 * source title announces "Extended Mix", those disagree. Absence of these
 * tokens is not evidence of correctness — it just means the title is silent.
 */
export const GENERIC_VERSION_TOKENS = [
  "remix",
  "rmx",
  "edit",
  "extended",
  "flip",
  "mashup",
  "bootleg",
  "vip",
  "radio edit",
  "club mix",
  "dub mix",
  "original mix",
] as const;

/**
 * Phrases where "original" modifies a version word.
 *
 * In dance-music convention "Original Mix" is how the *unremixed* release is
 * labelled — it is a synonym for "original", not a competing version. Scanning
 * naively for the token "mix" flags these as conflicts, which is exactly the
 * false positive that motivated stripping them first.
 */
export const ORIGINAL_SYNONYM_PATTERN =
  /\boriginal\s+(mix|edit|radio edit|version|cut|extended|extended mix)\b/g;

/** Trailing remix words to strip when extracting a remixer's name. */
export const REMIX_SUFFIX_PATTERN = /\s*(remix|rmx)\s*$/i;

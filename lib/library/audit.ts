/**
 * Library audit: find files that aren't what they claim to be.
 *
 * Everything here works off metadata you already have. No reference database,
 * no API keys, no lookups — which matters, because the moment a tool needs an
 * external catalogue to tell you your own library is broken, nobody runs it.
 *
 * The trick is that a track's *title* makes a claim about its length. "Radio
 * Edit" promises roughly three minutes. "Extended Mix" promises six or more.
 * When the file disagrees with its own title, something is wrong, and you can
 * detect that without knowing anything about the actual record.
 */

import type { Track } from "./types";

export type IssueKind =
  | "set_rip"
  | "clip"
  | "radio_edit_too_long"
  | "extended_too_short"
  | "duplicate_mismatch";

export interface Issue {
  track: Track;
  kind: IssueKind;
  headline: string;
  detail: string;
  /** How confident the heuristic is. Nothing here is certain. */
  confidence: "high" | "medium";
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/** Titles that openly declare the file is a long-form mix, so length is expected. */
const LONGFORM = /\b(dj (set|mix)|liveset|live set|continuous|podcast|radio ?show|mixtape|episode|hour)\b/i;

export function auditLibrary(tracks: Track[]): Issue[] {
  const issues: Issue[] = [];

  for (const t of tracks) {
    const d = t.features.durationS;
    const title = t.title;

    if (d > 900 && !LONGFORM.test(title)) {
      issues.push({
        track: t,
        kind: "set_rip",
        headline: "Probably a DJ set, filed as a track",
        detail: `${mmss(d)} long with nothing in the title saying it's a mix. Almost always a set recording with the record somewhere inside it.`,
        confidence: "high",
      });
      continue;
    }

    if (d < 90) {
      issues.push({
        track: t,
        kind: "clip",
        headline: "Too short to be the full record",
        detail: `${mmss(d)}. Usually a preview clip or a truncated download that cuts off partway.`,
        confidence: "high",
      });
      continue;
    }

    if (/\bradio edit\b/i.test(title) && d > 360) {
      issues.push({
        track: t,
        kind: "radio_edit_too_long",
        headline: "Called a Radio Edit, runs like an extended mix",
        detail: `Radio edits sit around 3 minutes. This one is ${mmss(d)} — the file is a different version than the title claims.`,
        confidence: "high",
      });
      continue;
    }

    if (/\bextended\b/i.test(title) && d < 240) {
      issues.push({
        track: t,
        kind: "extended_too_short",
        headline: "Called Extended, runs shorter than the original",
        detail: `Extended mixes run 6 minutes or more. This one is ${mmss(d)} — you'd load it expecting a long intro and not get one.`,
        confidence: "high",
      });
    }
  }

  // Same record, two files, wildly different lengths — one of them is wrong.
  const byName = new Map<string, Track[]>();
  for (const t of tracks) {
    const k = `${t.artist.toLowerCase()}|${t.title.toLowerCase().replace(/\s*-\s*(radio edit|extended mix).*$/i, "")}`;
    byName.set(k, [...(byName.get(k) ?? []), t]);
  }
  for (const group of byName.values()) {
    if (group.length < 2) continue;
    const lens = group.map((g) => g.features.durationS);
    const [min, max] = [Math.min(...lens), Math.max(...lens)];
    if (max / min < 1.25) continue;
    const worst = group.find((g) => g.features.durationS === max)!;
    if (issues.some((i) => i.track.id === worst.id)) continue;
    issues.push({
      track: worst,
      kind: "duplicate_mismatch",
      headline: "Two copies, very different lengths",
      detail: `You have this twice: ${mmss(min)} and ${mmss(max)}. They aren't the same recording, so one is mislabelled or one is a set rip.`,
      confidence: "medium",
    });
  }

  return issues;
}

export const ISSUE_LABEL: Record<IssueKind, string> = {
  set_rip: "Set filed as a track",
  clip: "Truncated file",
  radio_edit_too_long: "Radio Edit too long",
  extended_too_short: "Extended too short",
  duplicate_mismatch: "Duplicate mismatch",
};

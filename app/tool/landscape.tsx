"use client";

import { useState } from "react";

type NodeId =
  | "file"
  | "rekordbox-analysis"
  | "mik"
  | "essentia"
  | "crate-check"
  | "rekordbox"
  | "lexicon"
  | "usb"
  | "cdj";

interface ToolNode {
  id: NodeId;
  name: string;
  tag: string;
  what: string;
  outputs: string;
  doesnt: string;
}

const NODES: Record<NodeId, ToolNode> = {
  file: {
    id: "file",
    name: "The audio file",
    tag: "MP3 · AIFF · WAV · FLAC",
    what: "The track on your disk. Alongside the audio it carries metadata fields — artist, title, genre, comment, grouping — which every tool below can read and most can write.",
    outputs: "Audio, plus the tag fields that travel with the file wherever it goes.",
    doesnt: "Know anything about itself beyond what something has written into those fields.",
  },
  "rekordbox-analysis": {
    id: "rekordbox-analysis",
    name: "Rekordbox analysis",
    tag: "runs on import",
    what: "When you add a track, Rekordbox measures its tempo and key, places the beatgrid and draws the waveform you'll see on the CDJ.",
    outputs: "BPM, key, beatgrid, waveform.",
    doesnt: "Say anything about how a record feels or where it belongs in a night.",
  },
  mik: {
    id: "mik",
    name: "Mixed In Key",
    tag: "desktop app",
    what: "A dedicated key-detection app. Reports key in the Camelot notation most DJs read keys in, scores each track's energy from 1 to 10, and can set cue points.",
    outputs: "Key, an energy score and cues, written back into the file's tags.",
    doesnt: "Tag genre or feel, or plan a set.",
  },
  essentia: {
    id: "essentia",
    name: "Essentia",
    tag: "open source",
    what: "An audio-analysis library from the Music Technology Group at Universitat Pompeu Fabra in Barcelona. Its pretrained models listen to a track and return probabilities: how likely it is to be each of hundreds of genre styles, how party or relaxed it sounds, whether it has vocals.",
    outputs: "Numbers, not labels. A track is 0.64 Deep House and 0.88 relaxed — Essentia doesn't decide what that means.",
    doesnt: "Make any decisions, or talk to DJ software on its own. It's a library for building tools, not a tool.",
  },
  "crate-check": {
    id: "crate-check",
    name: "crate-check",
    tag: "this project",
    what: "Takes analysis numbers and turns them into a vocabulary — genre, feel, function, role, energy — each tag carrying the rule that produced it. Also checks incoming files, plans sets, and ranks what can follow the record playing.",
    outputs: "Tags written into standard metadata fields, so the tools downstream pick them up without anything extra installed.",
    doesnt: "Fix beatgrids, set cue points, export to USB, play audio, or download anything.",
  },
  rekordbox: {
    id: "rekordbox",
    name: "Rekordbox library",
    tag: "the hub",
    what: "Where the library actually lives: playlists, beatgrids, cue points, My Tags. It picks up tags written into the files when it imports them or when you reload tags.",
    outputs: "An organised library and, at export, everything the CDJ needs.",
    doesnt: "Tell you which records are hypnotic, or which one saves an emptying floor.",
  },
  lexicon: {
    id: "lexicon",
    name: "Lexicon",
    tag: "library manager",
    what: "Keeps a library in sync between DJ apps — Rekordbox, Serato, Traktor and others — and handles bulk tag editing, duplicate finding and general cleanup.",
    outputs: "A tidier library, mirrored into whichever DJ app you play from.",
    doesnt: "Analyze audio. It edits and moves what other tools produced.",
  },
  usb: {
    id: "usb",
    name: "USB export",
    tag: "the handoff",
    what: "Rekordbox writes the tracks to a stick along with a database file the CDJ reads: grids, cues, waveforms, playlists.",
    outputs: "Everything the booth will know about your music.",
    doesnt: "Carry anything you didn't export. The CDJ can't see your laptop.",
  },
  cdj: {
    id: "cdj",
    name: "CDJ",
    tag: "the booth",
    what: "The player. Reads the exported database to show BPM, key, the waveform and your cues, and lets you browse playlists while the other deck plays.",
    outputs: "The set.",
    doesnt: "Read anything that wasn't on the stick when you walked in.",
  },
};

function Box({
  id,
  active,
  onPick,
  wide,
}: {
  id: NodeId;
  active: NodeId;
  onPick: (id: NodeId) => void;
  wide?: boolean;
}) {
  const n = NODES[id];
  const isUs = id === "crate-check";
  const isActive = id === active;
  return (
    <button
      onClick={() => onPick(id)}
      className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${wide ? "w-full" : ""} ${
        isActive
          ? isUs
            ? "border-accent bg-accent/15"
            : "border-foreground/50 bg-panel2"
          : isUs
            ? "border-accent/45 bg-accent/[0.07] hover:border-accent/70"
            : "border-edge bg-panel/60 hover:border-foreground/30"
      }`}
    >
      <div className={`text-[13px] font-medium ${isUs ? "text-accent" : ""}`}>{n.name}</div>
      <div className="text-[11px] text-muted">{n.tag}</div>
    </button>
  );
}

const Arrow = ({ label }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-1.5 text-muted">
    <span className="text-[13px]">↓</span>
    {label && <span className="font-mono text-[10px] tracking-wide uppercase">{label}</span>}
  </div>
);

export default function Landscape() {
  const [active, setActive] = useState<NodeId>("essentia");
  const n = NODES[active];

  return (
    <section id="landscape" className="scroll-mt-4 border-t border-edge/60 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="mb-9 max-w-2xl">
          <div className="mb-3 font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
            The tools in this picture
          </div>
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-[28px]">
            Who does what between the file and the booth
          </h2>
          <p className="mt-3.5 text-[15px] leading-relaxed text-foreground/70">
            Several tools each own a piece of this. The thing that connects them is the file
            itself: each one reads what the last wrote into its tags, and adds its own. Click a
            box to see what it&rsquo;s actually for.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-xl border border-edge bg-panel/30 p-4 sm:p-6">
            <div className="mx-auto max-w-xl">
              <Box id="file" active={active} onPick={setActive} wide />
              <Arrow label="analyzed by one or more of" />
              <div className="grid grid-cols-3 gap-2">
                <Box id="rekordbox-analysis" active={active} onPick={setActive} wide />
                <Box id="mik" active={active} onPick={setActive} wide />
                <Box id="essentia" active={active} onPick={setActive} wide />
              </div>
              <Arrow label="numbers" />
              <Box id="crate-check" active={active} onPick={setActive} wide />
              <Arrow label="words, written into the file's tags" />
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <Box id="rekordbox" active={active} onPick={setActive} wide />
                <span className="font-mono text-[12px] text-muted" title="kept in sync">
                  ⇄
                </span>
                <Box id="lexicon" active={active} onPick={setActive} wide />
              </div>
              <Arrow label="export" />
              <Box id="usb" active={active} onPick={setActive} wide />
              <Arrow />
              <Box id="cdj" active={active} onPick={setActive} wide />
            </div>
          </div>

          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-xl border border-edge bg-panel/70 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className={`text-[17px] font-medium ${active === "crate-check" ? "text-accent" : ""}`}>
                  {n.name}
                </h3>
                <span className="text-[11px] text-muted">{n.tag}</span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-foreground/85">{n.what}</p>
              <dl className="mt-4 space-y-3 border-t border-edge/70 pt-4 text-[13px] leading-relaxed">
                <div>
                  <dt className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">Produces</dt>
                  <dd className="mt-1 text-foreground/80">{n.outputs}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">Doesn&rsquo;t</dt>
                  <dd className="mt-1 text-foreground/80">{n.doesnt}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-3 rounded-xl border border-accent/25 bg-accent/[0.06] p-4 text-[13px] leading-relaxed text-foreground/80">
              <strong className="text-foreground">Where crate-check overlaps, honestly:</strong>{" "}
              Mixed In Key also gives an energy score, and Lexicon also edits tags. It
              doesn&rsquo;t replace either — trust a dedicated key detector for key, and use
              Lexicon to keep libraries in sync. What none of them do is describe how a record
              feels or where it belongs in a night.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

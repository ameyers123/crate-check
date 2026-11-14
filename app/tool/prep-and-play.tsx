"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { tagLibrary } from "@/lib/library/tagger";
import { SET_SHAPES, planSet } from "@/lib/library/setshapes";
import type { Track } from "@/lib/library/types";
import Build from "./build";
import Live from "./live";
import Transition from "./transition";

/**
 * Prep and play, sharing one crate.
 *
 * These were two independent stages: you planned a set, and then the booth view
 * ranked the entire library as though the planning had never happened. The set
 * you build is the thing you walk in with, so it owns the state and both
 * stages read from it — change the shape upstream and the booth's options
 * change with it.
 */
export default function PrepAndPlay({
  library,
  between,
}: {
  library: Track[];
  /** Rendered between planning and the booth — the export to USB happens there. */
  between?: ReactNode;
}) {
  const { tracks } = useMemo(() => tagLibrary(library), [library]);
  const [shapeId, setShapeId] = useState("classic");

  const shape = SET_SHAPES.find((s) => s.id === shapeId) ?? SET_SHAPES[0];
  const plan = useMemo(() => planSet(shape, tracks), [shape, tracks]);
  const crate = useMemo(() => plan.map((p) => p.track), [plan]);

  return (
    <>
      <Build tracks={tracks} shape={shape} plan={plan} onShapeChange={setShapeId} />
      {between}
      <Live tracks={tracks} crate={crate} shapeName={shape.name} />
      <Transition key={shape.id} crate={crate} shapeName={shape.name} />
    </>
  );
}

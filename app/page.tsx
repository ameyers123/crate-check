import libraryData from "@/lib/library/library.json";
import incomingData from "@/lib/library/incoming.json";
import type { Track } from "@/lib/library/types";
import Pipeline from "./tool/pipeline";
import Listen from "./tool/listen";
import Analyze from "./tool/analyze";
import { Beatgrid, CuePoints } from "./tool/prepare";
import PrepAndPlay from "./tool/prep-and-play";
import AuditView from "./tool/audit";
import Landscape from "./tool/landscape";
import { Hero, Find, Collect, Export, Closing } from "./tool/static";

/**
 * Sections run in pipeline order, 1 to 11. Export sits inside PrepAndPlay's
 * slot because physically it happens between planning a set and playing it,
 * and the planned crate is shared state across both.
 */
export default function Home() {
  const library = libraryData as Track[];
  const incoming = incomingData as Track[];
  return (
    <main className="pb-24">
      <Hero trackCount={library.length} />
      <Pipeline />
      <Find />
      <Collect />
      <AuditView library={incoming} />
      <Listen />
      <Analyze library={library} />
      <Beatgrid library={library} />
      <CuePoints library={library} />
      <PrepAndPlay
        library={library}
        between={
          <>
            <Export />
            <Landscape />
          </>
        }
      />
      <Closing />
    </main>
  );
}

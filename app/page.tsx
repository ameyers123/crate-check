import libraryData from "@/lib/library/library.json";
import incomingData from "@/lib/library/incoming.json";
import type { Track } from "@/lib/library/types";
import Workflow from "./tool/workflow";
import Analyze from "./tool/analyze";
import Build from "./tool/build";
import Live from "./tool/live";
import AuditView from "./tool/audit";
import { Hero, Find, Collect, Export, Closing } from "./tool/static";

export default function Home() {
  const library = libraryData as Track[];
  const incoming = incomingData as Track[];
  return (
    <main className="pb-24">
      <Hero trackCount={library.length} />
      <Workflow />
      <Find />
      <Collect />
      <AuditView library={incoming} />
      <Analyze library={library} />
      <Build library={library} />
      <Live library={library} />
      <Export />
      <Closing />
    </main>
  );
}

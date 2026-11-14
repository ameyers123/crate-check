import sample from "@/lib/library/sample.json";
import type { Track } from "@/lib/library/types";
import Workflow from "./tool/workflow";
import Analyze from "./tool/analyze";
import Build from "./tool/build";
import AuditView from "./tool/audit";
import { Hero, Find, Collect, Export, Closing } from "./tool/static";

export default function Home() {
  const library = sample as Track[];
  return (
    <main className="pb-24">
      <Hero trackCount={library.length} />
      <Workflow />
      <Find />
      <Collect />
      <AuditView library={library} />
      <Analyze library={library} />
      <Build library={library} />
      <Export />
      <Closing />
    </main>
  );
}

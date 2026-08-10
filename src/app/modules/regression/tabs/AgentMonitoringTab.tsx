"use client";

import { Server } from "lucide-react";

// ponytail: no live Mac Mini / Jenkins agent network access in this environment (same
// ceiling as src/app/modules/jenkins/jenkins-tabs.tsx's AgentsTab); upgrade when this
// deployment can reach the on-prem Jenkins agents over the network.
export function AgentMonitoringTab() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Agent Monitoring</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Live status of the Mac Mini / Jenkins regression agents.</p>
      </div>
      <section className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <Server className="mx-auto size-8 text-zinc-400 dark:text-zinc-600" aria-hidden="true" />
        <h3 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Not available in this environment</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Agent monitoring requires a live connection to the on-prem Mac Mini Jenkins agents. This environment has no
          such network access, so agent status, executors, and job history cannot be shown here.
        </p>
      </section>
    </div>
  );
}

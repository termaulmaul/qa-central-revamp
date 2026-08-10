"use client";

import { Server } from "lucide-react";

export function AgentsView() {
  return (
    <section className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
      <Server className="size-8 text-zinc-400 dark:text-zinc-600" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Build Agents</h2>
      <p className="max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        Agent monitoring requires a live Jenkins connection. This environment has no configured Jenkins server, so agent
        status, executors, and online/offline controls are not available here.
      </p>
    </section>
  );
}

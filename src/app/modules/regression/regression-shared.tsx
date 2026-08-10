"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { fetchPlatforms, fetchRuns } from "./api";
import type { RegressionPlatform, RegressionRun } from "./types";

// Shared loading state that used to live in regression-tabs.tsx, lifted here now that
// each menu is its own route (mirrors jenkins-shared.tsx's useJenkinsJobs). Split into
// two hooks so a page only fetches what it actually renders.

export function useRegressionPlatforms() {
  const [platforms, setPlatforms] = useState<RegressionPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPlatforms(await fetchPlatforms());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load platforms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { platforms, loading, error, reload };
}

export function useRegressionRuns() {
  const [runs, setRuns] = useState<RegressionRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRuns(await fetchRuns());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load runs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { runs, loading, error, reload };
}

/** A regression page URL, carrying the selected run through as `?runId=`. */
export function regressionHref(menuId: string, runId?: string | null): string {
  const query = runId ? `?runId=${encodeURIComponent(runId)}` : "";
  return `/modules/regression/${menuId}${query}`;
}

/**
 * The selected run, kept in the URL rather than component state so Run Detail, Run
 * Cases Explorer, and the Failure Report cross-link all stay deep-linkable — the
 * reference reaches those views by drilling into a run, not via their own menu entry.
 */
export function useRunIdParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const runId = searchParams.get("runId");

  const setRunId = useCallback(
    (next: string | null) => {
      router.replace(`${pathname}${next ? `?runId=${encodeURIComponent(next)}` : ""}`, { scroll: false });
    },
    [pathname, router],
  );

  return { runId, setRunId };
}

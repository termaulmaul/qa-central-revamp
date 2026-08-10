"use client";

import { PlatformConfigTab } from "../tabs/PlatformConfigTab";
import { useRegressionPlatforms } from "../regression-shared";

export function PlatformConfigView() {
  const { platforms, loading, error, reload } = useRegressionPlatforms();
  return <PlatformConfigTab platforms={platforms} loading={loading} error={error} onReload={reload} />;
}

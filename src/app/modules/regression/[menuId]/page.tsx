import type { Metadata } from "next";
import { Suspense } from "react";
import { ModuleLayout } from "../../module-layout";
import { PlaceholderContent } from "../../page-shell";
import { resolveModulePage } from "../../module-page";
import { AgentMonitoringTab } from "../tabs/AgentMonitoringTab";
import { TradingHoursTab } from "../tabs/TradingHoursTab";
import { FailureReportView } from "../views/FailureReportView";
import { PlatformConfigView } from "../views/PlatformConfigView";
import { RunReportPageView } from "../views/RunReportPageView";
import { TestRunsView } from "../views/TestRunsView";

const MODULE_ID = "regression";

export async function generateMetadata({ params }: { params: Promise<{ menuId: string }> }): Promise<Metadata> {
  const { menuId } = await params;
  const { findMenuItem } = await import("@/lib/module-menus");
  const menu = findMenuItem(MODULE_ID, menuId);
  return { title: menu ? `${menu.label} | Regression` : "Regression" };
}

export default async function RegressionMenuPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const { qaModule, username, menu } = await resolveModulePage(MODULE_ID, menuId);

  // Each view already renders its own heading, so no shared PageHeading here.
  return (
    <ModuleLayout module={qaModule} username={username}>
      {menuId === "reg-agents" ? (
        <AgentMonitoringTab />
      ) : menuId === "reg-runs" ? (
        <Suspense fallback={null}>
          <TestRunsView />
        </Suspense>
      ) : menuId === "reg-config" ? (
        <PlatformConfigView />
      ) : menuId === "reg-failure" ? (
        <Suspense fallback={null}>
          <FailureReportView />
        </Suspense>
      ) : menuId === "reg-report" ? (
        <Suspense fallback={null}>
          <RunReportPageView />
        </Suspense>
      ) : menuId === "reg-hours" ? (
        <TradingHoursTab />
      ) : (
        <PlaceholderContent title={menu.label} moduleName={qaModule.name} menuId={menuId} />
      )}
    </ModuleLayout>
  );
}

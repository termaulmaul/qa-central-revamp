import type { Metadata } from "next";
import { ModuleLayout } from "../../module-layout";
import { PageHeading, PlaceholderContent } from "../../page-shell";
import { resolveModulePage } from "../../module-page";
import { AnalyticsView } from "../views/AnalyticsView";
import { BaselineView } from "../views/BaselineView";
import { DashboardView } from "../views/DashboardView";
import { GenerateView } from "../views/GenerateView";
import { HistoryView } from "../views/HistoryView";
import { KnowledgeView } from "../views/KnowledgeView";
import { RunView } from "../views/RunView";
import { SchedulerView } from "../views/SchedulerView";
import { SettingsView } from "../views/SettingsView";
import { TradingView } from "../views/TradingView";

const MODULE_ID = "api-automation";

export async function generateMetadata({ params }: { params: Promise<{ menuId: string }> }): Promise<Metadata> {
  const { menuId } = await params;
  const { findMenuItem } = await import("@/lib/module-menus");
  const menu = findMenuItem(MODULE_ID, menuId);
  return { title: menu ? `${menu.label} | API Automation` : "API Automation" };
}

export default async function ApiAutomationMenuPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const { qaModule, username, menu } = await resolveModulePage(MODULE_ID, menuId);

  return (
    <ModuleLayout module={qaModule} username={username}>
      <PageHeading title={menu.label} />
      {menuId === "af-dashboard" ? (
        <DashboardView />
      ) : menuId === "af-generate" ? (
        <GenerateView />
      ) : menuId === "af-run" ? (
        <RunView />
      ) : menuId === "af-scheduler" ? (
        <SchedulerView />
      ) : menuId === "af-history" ? (
        <HistoryView />
      ) : menuId === "af-knowledge" ? (
        <KnowledgeView />
      ) : menuId === "af-analytics" ? (
        <AnalyticsView />
      ) : menuId === "af-trading" ? (
        <TradingView />
      ) : menuId === "af-baseline" ? (
        <BaselineView />
      ) : menuId === "af-settings" ? (
        <SettingsView />
      ) : (
        <PlaceholderContent title={menu.label} moduleName={qaModule.name} menuId={menuId} />
      )}
    </ModuleLayout>
  );
}

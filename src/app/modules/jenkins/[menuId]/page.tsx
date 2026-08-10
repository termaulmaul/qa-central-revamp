import type { Metadata } from "next";
import { ModuleLayout } from "../../module-layout";
import { PageHeading, PlaceholderContent } from "../../page-shell";
import { resolveModulePage } from "../../module-page";
import { DashboardView } from "../views/DashboardView";
import { SchedulesView } from "../views/SchedulesView";
import { AgentsView } from "../views/AgentsView";

const MODULE_ID = "jenkins";

export async function generateMetadata({ params }: { params: Promise<{ menuId: string }> }): Promise<Metadata> {
  const { menuId } = await params;
  const { findMenuItem } = await import("@/lib/module-menus");
  const menu = findMenuItem(MODULE_ID, menuId);
  return { title: menu ? `${menu.label} | Jenkins CI` : "Jenkins CI" };
}

export default async function JenkinsMenuPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const { qaModule, username, menu } = await resolveModulePage(MODULE_ID, menuId);

  return (
    <ModuleLayout module={qaModule} username={username}>
      <PageHeading title={menu.label} />
      {menuId === "jk-dashboard" ? (
        <DashboardView />
      ) : menuId === "jk-schedules" ? (
        <SchedulesView />
      ) : menuId === "jk-agents" ? (
        <AgentsView />
      ) : (
        <PlaceholderContent title={menu.label} moduleName={qaModule.name} menuId={menuId} />
      )}
    </ModuleLayout>
  );
}

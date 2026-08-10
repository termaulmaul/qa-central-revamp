import type { Metadata } from "next";
import { ModuleLayout } from "../../module-layout";
import { PageHeading, PlaceholderContent, StaticPage } from "../../page-shell";
import { resolveModulePage } from "../../module-page";
import { STATIC_PAGES } from "../data";
import { ConnectionsView } from "../views/ConnectionsView";

const MODULE_ID = "configuration";

export async function generateMetadata({ params }: { params: Promise<{ menuId: string }> }): Promise<Metadata> {
  const { menuId } = await params;
  const { findMenuItem } = await import("@/lib/module-menus");
  const menu = findMenuItem(MODULE_ID, menuId);
  return { title: menu ? `${menu.label} | Configuration` : "Configuration" };
}

export default async function ConfigurationMenuPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const { qaModule, username, menu } = await resolveModulePage(MODULE_ID, menuId);
  const staticPage = STATIC_PAGES[menuId];

  return (
    <ModuleLayout module={qaModule} username={username}>
      {staticPage ? (
        <StaticPage data={staticPage} />
      ) : menuId === "connections" ? (
        <>
          <PageHeading title={menu.label} />
          <ConnectionsView />
        </>
      ) : (
        <PlaceholderContent title={menu.label} moduleName={qaModule.name} menuId={menuId} />
      )}
    </ModuleLayout>
  );
}

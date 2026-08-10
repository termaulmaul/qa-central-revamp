import type { Metadata } from "next";
import { ModuleLayout } from "../../module-layout";
import { PageHeading, PlaceholderContent } from "../../page-shell";
import { resolveModulePage } from "../../module-page";
import { TestReportsView } from "../test-reports-view";

const MODULE_ID = "test-reports";

export async function generateMetadata({ params }: { params: Promise<{ menuId: string }> }): Promise<Metadata> {
  const { menuId } = await params;
  const { findMenuItem } = await import("@/lib/module-menus");
  const menu = findMenuItem(MODULE_ID, menuId);
  return { title: menu ? `${menu.label} | Test Reports` : "Test Reports" };
}

export default async function TestReportsMenuPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const { qaModule, username, menu } = await resolveModulePage(MODULE_ID, menuId);

  return (
    <ModuleLayout module={qaModule} username={username}>
      {menuId === "rp-viewer" ? (
        <>
          <PageHeading title={menu.label} />
          <TestReportsView />
        </>
      ) : (
        <PlaceholderContent title={menu.label} moduleName={qaModule.name} menuId={menuId} />
      )}
    </ModuleLayout>
  );
}

import type { Metadata } from "next";
import { ModuleLayout } from "../../module-layout";
import { ComingSoon, StaticPage } from "../../page-shell";
import { resolveModulePage } from "../../module-page";
import { WEB_INVEST_OVERVIEW } from "../data";

const MODULE_ID = "web-invest";

export async function generateMetadata({ params }: { params: Promise<{ menuId: string }> }): Promise<Metadata> {
  const { menuId } = await params;
  const { findMenuItem } = await import("@/lib/module-menus");
  const menu = findMenuItem(MODULE_ID, menuId);
  return { title: menu ? `${menu.label} | Web Invest` : "Web Invest" };
}

export default async function WebInvestMenuPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const { qaModule, username, menu } = await resolveModulePage(MODULE_ID, menuId);

  return (
    <ModuleLayout module={qaModule} username={username}>
      {menuId === "overview" ? (
        <StaticPage data={WEB_INVEST_OVERVIEW} />
      ) : (
        // Parity with the reference: only `overview` has content in
        // MODULE_PAGES['web-invest'] under the current navigation, so every
        // other leaf renders the same placeholder upstream ships.
        <ComingSoon title={menu.label} moduleName={qaModule.name} />
      )}
    </ModuleLayout>
  );
}

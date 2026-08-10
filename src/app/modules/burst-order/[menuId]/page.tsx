import type { Metadata } from "next";
import { ModuleLayout } from "../../module-layout";
import { PageHeading, PlaceholderContent } from "../../page-shell";
import { resolveModulePage } from "../../module-page";
import { MODE_SUBTITLES, type BurstScript, type OrderMode } from "../burst-order-shared";
import { BurstOrderForm } from "../views/BurstOrderForm";
import { LoopingOrderForm } from "../views/LoopingOrderForm";

const MODULE_ID = "burst-order";

/**
 * One page per sidebar entry. The reference's Content.tsx renders the same
 * <BurstOrder /> for five menus, keyed by `script`, and a distinct
 * <LoopingBurstOrder /> for the sixth — this map keeps that shape.
 */
const MENU_MODES: Record<string, OrderMode> = {
  "bo-burst": "burst",
  "bo-fill-bid": "fill-bid",
  "bo-fill-offer": "fill-offer",
  "bo-fill-both": "fill-both",
  "bo-at-price": "at-price",
  "bo-looping": "looping",
};

export async function generateMetadata({ params }: { params: Promise<{ menuId: string }> }): Promise<Metadata> {
  const { menuId } = await params;
  const { findMenuItem } = await import("@/lib/module-menus");
  const menu = findMenuItem(MODULE_ID, menuId);
  return { title: menu ? `${menu.label} | Burst Order` : "Burst Order" };
}

export default async function BurstOrderMenuPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const { qaModule, username, menu } = await resolveModulePage(MODULE_ID, menuId);
  const mode = MENU_MODES[menuId];

  return (
    <ModuleLayout module={qaModule} username={username}>
      {mode ? (
        <>
          <PageHeading title={menu.label} subtitle={MODE_SUBTITLES[mode]} />
          {mode === "looping" ? (
            <LoopingOrderForm key={menuId} />
          ) : (
            <BurstOrderForm key={menuId} script={mode as BurstScript} />
          )}
        </>
      ) : (
        <PlaceholderContent title={menu.label} moduleName={qaModule.name} menuId={menuId} />
      )}
    </ModuleLayout>
  );
}

import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { modules, type QaModule } from "@/lib/modules";
import { defaultMenuId, findMenuItem, type MenuItem } from "@/lib/module-menus";

export type ResolvedModulePage = {
  qaModule: QaModule;
  username: string;
  menu: MenuItem;
};

/**
 * Shared resolution for every `/modules/<id>/<menuId>` page: validates the
 * module and menu id against the registry, enforces auth, and hands back what
 * the layout needs. Each module owns its own `[menuId]` segment because Next
 * does not fall back from a matched static segment to a sibling dynamic one.
 */
export async function resolveModulePage(moduleId: string, menuId: string): Promise<ResolvedModulePage> {
  const qaModule = modules.find((item) => item.id === moduleId);
  if (!qaModule) notFound();

  const menu = findMenuItem(moduleId, menuId);
  if (!menu) notFound();

  const profile = await requireAuth();
  return {
    qaModule,
    username: profile?.displayName ?? profile?.username ?? "there",
    menu,
  };
}

/** Bare `/modules/<id>` opens the module's first menu, as the reference does. */
export function redirectToDefaultMenu(moduleId: string): never {
  const menuId = defaultMenuId(moduleId);
  if (!menuId) notFound();
  redirect(`/modules/${moduleId}/${menuId}`);
}

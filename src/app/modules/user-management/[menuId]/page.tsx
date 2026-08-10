import type { Metadata } from "next";
import { ModuleLayout } from "../../module-layout";
import { PageHeading, PlaceholderContent } from "../../page-shell";
import { resolveModulePage } from "../../module-page";
import { ModuleAccessPanel } from "../../_shared/module-access-panel";
import { requireAuth } from "@/lib/auth";
import { DEV_BYPASS_USER_ID } from "@/lib/dev-auth";
import { UserManager } from "../user-manager";
import { ChangePassword } from "../change-password";

const MODULE_ID = "user-management";

/**
 * User administration and page access control stay restricted; Change Password
 * is account self-service and is available to every signed-in user, matching
 * the reference's "account settings for everyone" split.
 */
const ADMIN_ONLY_MENUS = new Set(["um-users", "um-page-access"]);

export async function generateMetadata({ params }: { params: Promise<{ menuId: string }> }): Promise<Metadata> {
  const { menuId } = await params;
  const { findMenuItem } = await import("@/lib/module-menus");
  const menu = findMenuItem(MODULE_ID, menuId);
  return { title: menu ? `${menu.label} | User Management` : "User Management" };
}

function NotAuthorized() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Not authorized</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        This page is restricted to god and admin roles. Your current role does not grant access.
      </p>
    </div>
  );
}

export default async function UserManagementMenuPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const { qaModule, username, menu } = await resolveModulePage(MODULE_ID, menuId);
  const profile = await requireAuth();
  const canAdminister = profile.role === "god" || profile.role === "admin";

  if (ADMIN_ONLY_MENUS.has(menuId) && !canAdminister) {
    return (
      <ModuleLayout module={qaModule} username={username}>
        <PageHeading title={menu.label} />
        <NotAuthorized />
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module={qaModule} username={username}>
      <PageHeading title={menu.label} />
      {menuId === "um-users" ? (
        <UserManager />
      ) : menuId === "um-page-access" ? (
        <ModuleAccessPanel />
      ) : menuId === "um-password" ? (
        <ChangePassword email={profile.email} devBypass={profile.id === DEV_BYPASS_USER_ID} />
      ) : (
        <PlaceholderContent title={menu.label} moduleName={qaModule.name} menuId={menuId} />
      )}
    </ModuleLayout>
  );
}

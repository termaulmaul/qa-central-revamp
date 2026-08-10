import type { Metadata } from "next";
import { ModuleLayout } from "../../module-layout";
import { ComingSoon, PageHeading } from "../../page-shell";
import { resolveModulePage } from "../../module-page";
import { DeviceHealthView } from "../../_device-health-shared/device-health-view";

const MODULE_ID = "android-health";

export async function generateMetadata({ params }: { params: Promise<{ menuId: string }> }): Promise<Metadata> {
  const { menuId } = await params;
  const { findMenuItem } = await import("@/lib/module-menus");
  const menu = findMenuItem(MODULE_ID, menuId);
  return { title: menu ? `${menu.label} | Android Health Monitoring` : "Android Health Monitoring" };
}

export default async function AndroidHealthMenuPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const { qaModule, username, menu } = await resolveModulePage(MODULE_ID, menuId);

  // Only Device Farm has an implementation upstream; the reference renders its
  // own placeholder for Test Runs, Crash Reports, Alert Rules, and Weekly
  // Reports, so there is nothing to port for those.
  if (menuId !== "ah-device-farm") {
    return (
      <ModuleLayout module={qaModule} username={username}>
        <ComingSoon title={menu.label} moduleName={qaModule.name} />
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module={qaModule} username={username}>
      <PageHeading title={menu.label} />
      <DeviceHealthView platform="android" apiPath="/api/device-health/android" />
    </ModuleLayout>
  );
}

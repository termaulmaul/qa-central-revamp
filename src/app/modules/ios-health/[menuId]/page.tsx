import type { Metadata } from "next";
import { ModuleLayout } from "../../module-layout";
import { ComingSoon, PageHeading } from "../../page-shell";
import { resolveModulePage } from "../../module-page";
import { DeviceHealthView } from "../../_device-health-shared/device-health-view";

const MODULE_ID = "ios-health";

export async function generateMetadata({ params }: { params: Promise<{ menuId: string }> }): Promise<Metadata> {
  const { menuId } = await params;
  const { findMenuItem } = await import("@/lib/module-menus");
  const menu = findMenuItem(MODULE_ID, menuId);
  return { title: menu ? `${menu.label} | iOS Health Monitoring` : "iOS Health Monitoring" };
}

export default async function IosHealthMenuPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const { qaModule, username, menu } = await resolveModulePage(MODULE_ID, menuId);

  // Device Farm is the only menu with an upstream implementation; Alert Rules
  // and Reports fall through to the reference's own placeholder.
  if (menuId !== "ih-device-farm") {
    return (
      <ModuleLayout module={qaModule} username={username}>
        <ComingSoon title={menu.label} moduleName={qaModule.name} />
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module={qaModule} username={username}>
      <PageHeading title={menu.label} />
      <DeviceHealthView platform="ios" apiPath="/api/device-health/ios" />
    </ModuleLayout>
  );
}

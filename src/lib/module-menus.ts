// Per-module navigation, ported from the reference dashboard's MODULES
// registry (qa-central-dashboard/src/lib/modules.ts). Menu ids are kept
// identical to the reference so page-access keys and any future permission
// wiring line up with the legacy data.
//
// Not included here: "performance" and "test-case-generator". Both ship their
// own self-contained navigation (src/app/modules/performance/page.tsx and the
// root "/" app respectively) and are deliberately left untouched.

export type MenuIconName =
  | "dashboard" | "execute" | "queue" | "history" | "catalog" | "projects"
  | "cron" | "webhook" | "settings" | "users" | "access" | "document"
  | "connector" | "gitCompare" | "checkCircle" | "refresh" | "zap"
  | "trendingUp" | "trendingDown" | "arrowUpDown" | "target" | "key"
  | "layers" | "clipboard" | "alert" | "smartphone" | "server" | "database"
  | "activity" | "activitySquare" | "calendar" | "barChart" | "wrench";

export type MenuItem = {
  id: string;
  label: string;
  icon?: MenuIconName;
  /** Badge count shown next to the label, as in the reference. */
  n?: number;
  subItems?: MenuItem[];
};

export type MenuGroup = { type: "group"; label: string };

export type ModuleMenu = MenuItem | MenuGroup;

export const isMenuItem = (menu: ModuleMenu): menu is MenuItem => !("type" in menu);

export const MODULE_MENUS: Record<string, ModuleMenu[]> = {
  "web-invest": [
    { id: "overview", label: "Dashboard", icon: "dashboard" },
    {
      id: "execution", label: "Execution", icon: "execute", subItems: [
        { id: "run-test", label: "Run Test" },
        { id: "queue", label: "Queue" },
        { id: "schedule", label: "Schedule" },
        { id: "running", label: "Running" },
      ],
    },
    {
      id: "test-catalog", label: "Test Catalog", icon: "layers", subItems: [
        { id: "suites", label: "Suites" },
        { id: "scenarios", label: "Scenarios" },
        { id: "test-cases", label: "Test Cases" },
        { id: "tags", label: "Tags" },
      ],
    },
    {
      id: "reports", label: "Reports", icon: "clipboard", subItems: [
        { id: "history", label: "History" },
        { id: "html", label: "HTML" },
        { id: "screenshots", label: "Screenshots" },
        { id: "videos", label: "Videos" },
        { id: "trends", label: "Trends" },
      ],
    },
    {
      id: "failures", label: "Failures", icon: "alert", subItems: [
        { id: "failed-tests", label: "Failed Tests" },
        { id: "flaky", label: "Flaky" },
        { id: "retry", label: "Retry" },
      ],
    },
    {
      id: "devices", label: "Devices", icon: "smartphone", subItems: [
        { id: "android", label: "Android" },
        { id: "ios", label: "iOS" },
        { id: "health", label: "Health" },
      ],
    },
    {
      id: "environment", label: "Environment", icon: "server", subItems: [
        { id: "env-dev", label: "DEV" },
        { id: "env-qa", label: "QA" },
        { id: "env-uat", label: "UAT" },
        { id: "variables", label: "Variables" },
      ],
    },
    { id: "test-data", label: "Test Data", icon: "database" },
    { id: "api-catalog", label: "API Catalog", icon: "catalog" },
    { id: "performance", label: "Performance", icon: "zap" },
    { id: "coverage", label: "Coverage", icon: "checkCircle" },
    { id: "ci-cd", label: "CI/CD", icon: "gitCompare" },
    { id: "diagnostics", label: "Diagnostics", icon: "activity" },
    { id: "documentation", label: "Documentation", icon: "document" },
    { id: "settings", label: "Settings", icon: "settings" },
  ],

  "api-automation": [
    { id: "af-dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "af-generate", label: "Generate", icon: "zap" },
    { id: "af-run", label: "Run", icon: "execute" },
    { id: "af-scheduler", label: "Scheduler", icon: "cron" },
    { id: "af-history", label: "History", icon: "history" },
    { id: "af-knowledge", label: "Knowledge", icon: "catalog" },
    { id: "af-analytics", label: "Analytics", icon: "trendingUp" },
    { id: "af-trading", label: "Trading", icon: "arrowUpDown" },
    { id: "af-baseline", label: "Baseline", icon: "target" },
    { id: "af-settings", label: "Settings", icon: "settings" },
  ],

  "android-health": [
    { id: "ah-device-farm", label: "Device Farm", icon: "projects" },
    { id: "ah-test-runs", label: "Test Runs", icon: "execute" },
    { id: "ah-crash-reports", label: "Crash Reports", icon: "history" },
    { id: "ah-alert-rules", label: "Alert Rules", icon: "webhook" },
    { id: "ah-reports", label: "Weekly Reports", icon: "catalog" },
  ],

  "ios-health": [
    { id: "ih-device-farm", label: "Device Farm", icon: "projects" },
    { id: "ih-alert-rules", label: "Alert Rules", icon: "webhook" },
    { id: "ih-reports", label: "Reports", icon: "catalog" },
  ],

  jenkins: [
    { id: "jk-dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "jk-schedules", label: "Schedules", icon: "cron" },
    { id: "jk-agents", label: "Agents", icon: "users" },
  ],

  "burst-order": [
    { id: "bo-burst", label: "Random Burst", icon: "zap" },
    { id: "bo-fill-bid", label: "Fill Bid", icon: "trendingDown" },
    { id: "bo-fill-offer", label: "Fill Offer", icon: "trendingUp" },
    { id: "bo-fill-both", label: "Fill Both Sides", icon: "arrowUpDown" },
    { id: "bo-at-price", label: "At Price", icon: "target" },
    { id: "bo-looping", label: "Looping Order", icon: "refresh" },
  ],

  "test-reports": [
    { id: "rp-viewer", label: "Reports", icon: "catalog" },
  ],

  configuration: [
    { id: "environments", label: "Environments", n: 4, icon: "dashboard" },
    { id: "feature-flags", label: "Feature Flags", n: 17, icon: "settings" },
    { id: "schedules", label: "Test Schedules", n: 6, icon: "cron" },
    { id: "integrations", label: "Integrations", icon: "webhook" },
    { id: "notifications", label: "Notifications", icon: "history" },
    { id: "connections", label: "Connections", icon: "webhook" },
  ],

  regression: [
    { type: "group", label: "Monitor" },
    { id: "reg-agents", label: "Agent Monitor", icon: "server" },
    { type: "group", label: "Setup" },
    { id: "reg-runs", label: "Test Runs", icon: "activitySquare" },
    { id: "reg-config", label: "Platform Config", icon: "wrench" },
    { type: "group", label: "Analytics" },
    { id: "reg-failure", label: "Failure Report", icon: "barChart" },
    { id: "reg-report", label: "Run Report", icon: "document" },
    { id: "reg-hours", label: "Trading Hours", icon: "calendar" },
  ],

  "user-management": [
    { id: "um-users", label: "User Manager", icon: "users" },
    { id: "um-page-access", label: "Page Access Manager", icon: "access" },
    { id: "um-password", label: "Change Password", icon: "key" },
  ],
};

/** Every leaf (navigable) menu id for a module, parents with subItems excluded. */
export function leafMenuIds(moduleId: string): string[] {
  const menus = MODULE_MENUS[moduleId] ?? [];
  return menus.filter(isMenuItem).flatMap((item) =>
    item.subItems?.length ? item.subItems.map((sub) => sub.id) : [item.id],
  );
}

/** The menu a module opens on when no page is specified. */
export function defaultMenuId(moduleId: string): string | null {
  return leafMenuIds(moduleId)[0] ?? null;
}

export function findMenuItem(moduleId: string, menuId: string): MenuItem | null {
  for (const menu of MODULE_MENUS[moduleId] ?? []) {
    if (!isMenuItem(menu)) continue;
    if (menu.id === menuId && !menu.subItems?.length) return menu;
    const sub = menu.subItems?.find((item) => item.id === menuId);
    if (sub) return sub;
  }
  return null;
}

/** The parent menu label for a sub-item, for breadcrumbs. */
export function parentMenuLabel(moduleId: string, menuId: string): string | null {
  for (const menu of MODULE_MENUS[moduleId] ?? []) {
    if (!isMenuItem(menu) || !menu.subItems?.length) continue;
    if (menu.subItems.some((item) => item.id === menuId)) return menu.label;
  }
  return null;
}

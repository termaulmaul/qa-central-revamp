export type ModuleStatus = "Available" | "Coming Soon" | "Disabled" | "Beta";
export type ModuleIcon = "activity" | "chart" | "bot" | "flask" | "heart" | "phone" | "git" | "orders" | "reports" | "settings" | "regression" | "users";

export type QaModule = {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: ModuleIcon;
  status: ModuleStatus;
  route: string;
  permission: string;
  enabled: boolean;
};

const comingSoon = {
  status: "Coming Soon" as const,
  enabled: true,
};

export const modules: QaModule[] = [
  { id: "performance", name: "Performance Test Dashboard", title: "Performance Test Dashboard", description: "Monitor performance metrics, response times, and load testing.", icon: "activity", permission: "performance:read", route: "/modules/performance", ...comingSoon },
  { id: "web-invest", name: "Web Invest Dashboard", title: "Web Invest Dashboard", description: "Test status, automation results, and reports for Web Invest.", icon: "chart", permission: "web-invest:read", route: "/modules/web-invest", ...comingSoon },
  { id: "test-case-generator", name: "Test Case Generator", title: "Test Case Generator", description: "Requirement-driven automation pipeline for generating and tracking test coverage.", icon: "flask", status: "Available", enabled: true, route: "/", permission: "test-cases:read" },
  { id: "api-automation", name: "API Automation", title: "API Automation", description: "AI-powered API test generation, execution, healing, and analytics.", icon: "bot", permission: "api:read", route: "/modules/api-automation", ...comingSoon },
  { id: "android-health", name: "Android Health Monitoring", title: "Android Health Monitoring", description: "Build status, regression suites, and crash analytics for Android.", icon: "heart", permission: "android:read", route: "/modules/android-health", ...comingSoon },
  { id: "ios-health", name: "iOS Health Monitoring", title: "iOS Health Monitoring", description: "Real-time device farm health and recovery monitoring for iOS.", icon: "phone", permission: "ios:read", route: "/modules/ios-health", ...comingSoon },
  { id: "jenkins", name: "Jenkins CI", title: "Jenkins CI", description: "Monitor build jobs, pipeline stages, and build agents.", icon: "git", permission: "jenkins:read", route: "/modules/jenkins", ...comingSoon },
  { id: "burst-order", name: "Burst Order", title: "Burst Order", description: "K6-powered trading order automation and test scenarios.", icon: "orders", permission: "burst-order:read", route: "/modules/burst-order", ...comingSoon },
  { id: "test-reports", name: "Test Reports", title: "Test Reports", description: "Browse and inspect automation test run results.", icon: "reports", permission: "reports:read", route: "/modules/test-reports", ...comingSoon },
  { id: "configuration", name: "Configuration", title: "Configuration", description: "Manage environments, base URLs, feature flags, and schedules.", icon: "settings", permission: "configuration:read", route: "/modules/configuration", ...comingSoon },
  { id: "regression", name: "Regression Dashboard", title: "Regression Dashboard", description: "Monitor and analyze regression tests across platforms.", icon: "regression", permission: "regression:read", route: "/modules/regression", ...comingSoon },
  { id: "user-management", name: "User Management", title: "User Management", description: "Manage users, roles, and page access control.", icon: "users", permission: "users:read", route: "/modules/user-management", ...comingSoon },
];

export const availableModules = modules.filter(({ enabled, status }) => enabled && (status === "Available" || status === "Beta"));

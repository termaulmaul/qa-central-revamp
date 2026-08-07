import type { LucideIcon } from "lucide-react";
import { Activity, Bot, FlaskConical, LineChart } from "lucide-react";

export type ModuleStatus = "Available" | "Coming Soon" | "Disabled" | "Beta";

export type QaModule = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: ModuleStatus;
  route: string;
};

export const modules: QaModule[] = [
  {
    id: "performance",
    title: "Performance Test Dashboard",
    description: "Monitor k6 performance testing",
    icon: Activity,
    status: "Coming Soon",
    route: "/",
  },
  {
    id: "web-invest",
    title: "Web Invest Dashboard",
    description: "Trading QA Dashboard",
    icon: LineChart,
    status: "Coming Soon",
    route: "/",
  },
  {
    id: "test-case-generator",
    title: "Test Case Generator",
    description: "Requirement → Test Case Pipeline",
    icon: FlaskConical,
    status: "Available",
    route: "/",
  },
  {
    id: "api-automation",
    title: "API Automation",
    description: "AI API Testing",
    icon: Bot,
    status: "Coming Soon",
    route: "/",
  },
];

export const availableModules = modules.filter(({ status }) => status === "Available" || status === "Beta");

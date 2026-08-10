import type { StaticPageData } from "../page-shell";

// Ported verbatim from the reference dashboard's MODULE_PAGES.configuration
// (qa-central-dashboard/src/lib/module-pages.ts). These five pages are static/mock
// there too, so mock data here is correct parity, not a stub. Rendered through the
// shared StaticPage helper so every static page in the app looks identical.
export const STATIC_PAGES: Record<string, StaticPageData> = {
  environments: {
    title: "Environments",
    subtitle: "Runtime endpoints, health checks, and deployment ownership.",
    metrics: [
      ["Environments", "4", "All monitored"],
      ["Healthy", "3", "75%"],
      ["Degraded", "1", "Integration"],
      ["Certificates", "28d", "Nearest expiry"],
    ],
    section: "Environment Registry",
    columns: ["Environment", "Base URL", "Owner", "Status"],
    rows: [
      ["Production", "invest.growin.id", "SRE", "HEALTHY"],
      ["Staging", "stg-invest.growin.id", "QA Platform", "HEALTHY"],
      ["Integration", "int-invest.growin.id", "Backend QA", "DEGRADED"],
    ],
  },
  "feature-flags": {
    title: "Feature Flags",
    subtitle: "Controlled rollout status and audience targeting.",
    metrics: [
      ["Flags", "17", "Across 4 apps"],
      ["Enabled", "11", "64.7%"],
      ["Gradual", "4", "Targeted"],
      ["Stale", "2", "Review required"],
    ],
    section: "Flag Registry",
    columns: ["Flag", "Audience", "Rollout", "State"],
    rows: [
      ["new-order-ticket", "Beta users", "25%", "ENABLED"],
      ["portfolio-insights", "Internal", "100%", "ENABLED"],
      ["streaming-v2", "All users", "0%", "DISABLED"],
    ],
  },
  schedules: {
    title: "Test Schedules",
    subtitle: "Recurring quality checks and next execution windows.",
    metrics: [
      ["Schedules", "6", "5 active"],
      ["Next Run", "12m", "Smoke suite"],
      ["Success", "96.4%", "30 days"],
      ["Missed", "0", "This week"],
    ],
    section: "Schedule Registry",
    columns: ["Schedule", "Cron", "Target", "State"],
    rows: [
      ["Nightly regression", "0 1 * * *", "Staging", "ACTIVE"],
      ["API smoke", "*/30 * * * *", "Integration", "ACTIVE"],
      ["Weekly visual", "0 3 * * 1", "Production", "PAUSED"],
    ],
  },
  integrations: {
    title: "Integrations",
    subtitle: "Connected QA systems, delivery health, and sync ownership.",
    metrics: [
      ["Connected", "8", "7 healthy"],
      ["Events", "1.8k", "Last 24h"],
      ["Failures", "4", "0.2%"],
      ["Latency", "320ms", "p95 delivery"],
    ],
    section: "Integration Health",
    columns: ["System", "Purpose", "Last Sync", "Status"],
    rows: [
      ["Qase", "Test management", "2m ago", "CONNECTED"],
      ["Jira", "Defect tracking", "4m ago", "CONNECTED"],
      ["Slack", "Notifications", "1m ago", "DEGRADED"],
    ],
  },
  notifications: {
    title: "Notifications",
    subtitle: "Delivery rules and recent quality alerts across channels.",
    metrics: [
      ["Sent", "286", "Last 24h"],
      ["Delivered", "99.3%", "All channels"],
      ["Muted", "4", "Maintenance"],
      ["Escalated", "2", "Pager route"],
    ],
    section: "Recent Deliveries",
    columns: ["Event", "Channel", "Audience", "Status"],
    rows: [
      ["Regression failed", "Slack", "#qa-alerts", "DELIVERED"],
      ["Crash rate high", "Pager", "Mobile on-call", "DELIVERED"],
      ["Integration degraded", "Email", "QA Platform", "RETRYING"],
    ],
  },
};

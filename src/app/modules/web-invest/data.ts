// Static content ported from the reference dashboard
// (qa-central-dashboard/src/lib/module-pages.ts -> MODULE_PAGES['web-invest'].overview).
// This was mock/display data in the source app too - no backend ever backed it,
// so it is ported as-is rather than wired up to a live API.
//
// The reference's newer navigation only keeps `overview` as a menu with real
// content; every other leaf renders ComingSoon there as well, so the former
// `e2e-tests` / `ui-regression` / `lighthouse` mock pages have no destination
// and are intentionally not carried over.

import type { StaticPageData } from "../page-shell";

export const WEB_INVEST_OVERVIEW: StaticPageData = {
  title: "Web Quality Overview",
  subtitle: "Release confidence across automation, visual stability, and page experience.",
  metrics: [
    ["E2E Pass Rate", "97.8%", "Last 24 hours"],
    ["Automation", "84%", "42 active tests"],
    ["Visual Drift", "3", "Needs review"],
    ["Lighthouse", "92", "Mobile average"],
  ],
  section: "Release Readiness",
  columns: ["Area", "Coverage", "Latest Result", "Owner"],
  rows: [
    ["Trading", "96%", "PASS", "Web QA"],
    ["Portfolio", "89%", "PASS", "Core QA"],
    ["Market Data", "78%", "REVIEW", "Platform QA"],
  ],
};

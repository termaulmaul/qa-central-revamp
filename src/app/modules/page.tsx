import type { Metadata } from "next";
import { ModuleSelector } from "./module-selector";
import { getSessionProfile } from "@/lib/auth";
import { modules } from "@/lib/modules";

export const metadata: Metadata = {
  title: "Choose a module | QA Central",
  description: "Choose a QA Central module to continue.",
};

export default async function ModulesPage() {
  const profile = await getSessionProfile();

  return (
    <ModuleSelector
      modules={modules}
      username={profile?.displayName ?? profile?.username ?? "there"}
    />
  );
}

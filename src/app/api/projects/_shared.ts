import type { Project } from "@/server/db/repositories/project-repo";

// Shape expected by ProjectsTab.tsx. project-repo.ts's Project has no
// status/archived concept at all (no column exists), and its metadata/
// version/owner/team/services/description fields live entirely inside the
// free-form `metadata` jsonb column (no migration needed) rather than as
// their own columns.
export interface ProjectView {
  id: string;
  name: string;
  status: "active" | "archived";
  metadata: {
    slug?: string;
    version?: string;
    owner?: string;
    team?: string;
    services?: string[];
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function toProjectView(project: Project): ProjectView {
  const meta = project.metadata as {
    archived?: unknown;
    version?: unknown;
    owner?: unknown;
    team?: unknown;
    services?: unknown;
    description?: unknown;
  };
  return {
    id: project.id,
    name: project.name,
    status: meta.archived === true ? "archived" : "active",
    metadata: {
      slug: project.id,
      version: typeof meta.version === "string" ? meta.version : undefined,
      owner: typeof meta.owner === "string" ? meta.owner : undefined,
      team: typeof meta.team === "string" ? meta.team : undefined,
      services: Array.isArray(meta.services) ? meta.services.filter((v): v is string => typeof v === "string") : undefined,
      description: typeof meta.description === "string" ? meta.description : undefined,
    },
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

// ProjectsTab.tsx's form sends { name, version, owner, team, services,
// description } — services as a single comma-separated string. Builds the
// metadata patch to merge over the project's existing metadata.
export function metadataPatchFromForm(
  existing: Record<string, unknown>,
  body: { version?: unknown; owner?: unknown; team?: unknown; services?: unknown; description?: unknown },
): Record<string, unknown> {
  const metadata = { ...existing };
  if (typeof body.version === "string") metadata.version = body.version;
  if (typeof body.owner === "string") metadata.owner = body.owner;
  if (typeof body.team === "string") metadata.team = body.team;
  if (typeof body.description === "string") metadata.description = body.description;
  if (typeof body.services === "string") {
    metadata.services = body.services.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return metadata;
}

import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { addCatalogEntry, listCatalog, type CatalogEntry } from "@/server/db/repositories/catalog-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

// Shape expected by ApiCatalogTab.tsx's Endpoint. `service`/`platforms` have
// no dedicated columns; they're kept in the free-form `spec` jsonb (no
// migration needed) and `tags` respectively.
function toEndpoint(entry: CatalogEntry): { id: string; name: string; method: string; path: string; service: string; platforms: string[] } {
  const spec = entry.spec as { service?: unknown };
  const service = typeof spec.service === "string" && spec.service ? spec.service : (entry.path.split("/").filter(Boolean)[0] ?? "other");
  return {
    id: entry.id,
    name: entry.path,
    method: entry.method,
    path: entry.path,
    service,
    platforms: entry.tags.length ? entry.tags : ["WEB"],
  };
}

export async function GET(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId") ?? undefined;

  try {
    // ApiCatalogTab.tsx expects a raw Endpoint[] array, not an { endpoints } envelope.
    const endpoints = await listCatalog(projectId);
    return NextResponse.json(endpoints.map(toEndpoint));
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  // ApiCatalogTab.tsx's "Add Endpoint" form POSTs one endpoint's fields at the
  // top level (projectId, method, path, service, platforms, description) —
  // never an `endpoints` array. The previous handler read body.endpoints
  // (always undefined here), defaulted to [], and called replaceProjectCatalog
  // with it — which WIPES the entire project catalog and inserts nothing on
  // every single "Add Endpoint" submit.
  const { projectId, method, path, service, platforms, description } = body ?? {};
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  if (!method || !path) return NextResponse.json({ error: "method and path are required" }, { status: 400 });

  try {
    const { entry, duplicate } = await addCatalogEntry({
      projectId,
      method,
      path,
      tags: Array.isArray(platforms) ? platforms.filter((v: unknown): v is string => typeof v === "string") : [],
      spec: { service: typeof service === "string" ? service : "", ...(description ? { description } : {}) },
    });
    if (duplicate) return NextResponse.json({ error: "CATALOG_ENDPOINT_EXISTS" }, { status: 409 });
    return NextResponse.json(toEndpoint(entry));
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { updateJobStatus } from "@/server/db/repositories/queue-repo";
import { RepositoryError } from "@/server/db/repositories/errors";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const job = await updateJobStatus(id, "cancelled");
    return NextResponse.json({ status: job.status });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

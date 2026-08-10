import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";
import { getGlobalSettingsProjectId, getSetting, upsertSetting } from "@/server/db/repositories/settings-repo";
import { RepositoryError } from "@/server/db/repositories/errors";
import { NOTIFY_REF_LIST, buildAppConfigView } from "../route";

// Secret convention shared by onprem's password/testPassword/testPin,
// notify's five webhook refs, and qase's apiToken (matches secretPayload()
// in SettingsTab.tsx): '' = leave the stored secret unchanged, null =
// explicitly clear it, any other non-empty string = set it.
function applySecret(next: Record<string, unknown>, key: string, value: unknown): string | null {
  if (value === null) {
    delete next[key];
    return null;
  }
  if (typeof value === "string") {
    if (value !== "") next[key] = value;
    return null;
  }
  return `${key} must be a string or null`;
}

const CARDS = ["onprem", "notify", "queue", "auth", "qase"] as const;
type Card = typeof CARDS[number];

export async function POST(request: NextRequest, { params }: { params: Promise<{ card: string }> }) {
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { card } = await params;
  if (!CARDS.includes(card as Card)) {
    return NextResponse.json({ error: "Unknown card" }, { status: 400 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const projectId = await getGlobalSettingsProjectId();

    switch (card as Card) {
      case "onprem": {
        const stored = (await getSetting(projectId, "app-config-onprem")) ?? {};
        const next: Record<string, unknown> = { ...stored };
        for (const key of ["host1", "host2", "user", "user2"] as const) {
          if (key in body) {
            if (typeof body[key] !== "string") {
              return NextResponse.json({ error: `${key} must be a string` }, { status: 400 });
            }
            next[key] = body[key];
          }
        }
        for (const key of ["password", "testPassword", "testPin"] as const) {
          if (key in body) {
            const err = applySecret(next, key, body[key]);
            if (err) return NextResponse.json({ error: err }, { status: 400 });
          }
        }
        await upsertSetting(projectId, "app-config-onprem", next);
        break;
      }
      case "notify": {
        const stored = (await getSetting(projectId, "app-config-notify")) ?? {};
        const next: Record<string, unknown> = { ...stored };
        for (const ref of NOTIFY_REF_LIST) {
          if (ref in body) {
            const err = applySecret(next, ref, body[ref]);
            if (err) return NextResponse.json({ error: err }, { status: 400 });
          }
        }
        await upsertSetting(projectId, "app-config-notify", next);
        break;
      }
      case "queue": {
        const stored = (await getSetting(projectId, "app-config-queue")) ?? {};
        const next: Record<string, unknown> = { ...stored };
        for (const key of ["queuePollMs", "queueLeaseSeconds", "cronPollMs", "cronBatchSize"] as const) {
          if (key in body) {
            const value = body[key];
            if (typeof value !== "number" || !Number.isFinite(value)) {
              return NextResponse.json({ error: `${key} must be a number` }, { status: 400 });
            }
            next[key] = value;
          }
        }
        if ("cronEnabled" in body) {
          if (typeof body.cronEnabled !== "boolean") {
            return NextResponse.json({ error: "cronEnabled must be a boolean" }, { status: 400 });
          }
          next.cronEnabled = body.cronEnabled;
        }
        await upsertSetting(projectId, "app-config-queue", next);
        break;
      }
      case "auth": {
        const stored = (await getSetting(projectId, "app-config-auth")) ?? {};
        const next: Record<string, unknown> = { ...stored };
        for (const key of ["sessionHours", "rateLimitWindowSeconds", "rateLimitMax", "passwordExpiryWarningDays"] as const) {
          if (key in body) {
            const value = body[key];
            if (typeof value !== "number" || !Number.isFinite(value)) {
              return NextResponse.json({ error: `${key} must be a number` }, { status: 400 });
            }
            next[key] = value;
          }
        }
        await upsertSetting(projectId, "app-config-auth", next);
        break;
      }
      case "qase": {
        const stored = (await getSetting(projectId, "app-config-qase")) ?? {};
        const next: Record<string, unknown> = { ...stored };
        if ("baseUrl" in body) {
          if (typeof body.baseUrl !== "string") {
            return NextResponse.json({ error: "baseUrl must be a string" }, { status: 400 });
          }
          next.baseUrl = body.baseUrl;
        }
        if ("apiToken" in body) {
          const err = applySecret(next, "apiToken", body.apiToken);
          if (err) return NextResponse.json({ error: err }, { status: 400 });
        }
        await upsertSetting(projectId, "app-config-qase", next);
        break;
      }
    }

    const appConfig = await buildAppConfigView(projectId);
    return NextResponse.json({ appConfig });
  } catch (err) {
    if (err instanceof RepositoryError) return NextResponse.json({ error: err.message }, { status: 500 });
    throw err;
  }
}

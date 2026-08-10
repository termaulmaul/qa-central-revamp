"use client";

// Consumed by user-management's `um-page-access` page. Moved out of Configuration
// because role x page access control lives in the user-management module in the
// reference dashboard (um-page-access -> UnifiedPageAccessManager), not Configuration.
// Backend is /api/module-access (unchanged).

import { useCallback, useEffect, useState } from "react";
import type { UserRole } from "@/lib/auth";
import { modules } from "@/lib/modules";

type ModuleAccessRule = { id: string; roleCode: string; moduleId: string; allowed: boolean };

const GRID_ROLES: UserRole[] = ["admin", "qa", "developer", "viewer"];

export function ModuleAccessPanel() {
  const [rules, setRules] = useState<ModuleAccessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/module-access");
      const body = (await response.json().catch(() => null)) as { rules?: ModuleAccessRule[]; error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "Unable to load module access");
      setRules(Array.isArray(body?.rules) ? body.rules : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load module access");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const allowedFor = useCallback(
    (roleCode: string, moduleId: string) => {
      const rule = rules.find((item) => item.roleCode === roleCode && item.moduleId === moduleId);
      // Absence means "not yet restricted" — default to allowed/checked.
      return rule ? rule.allowed : true;
    },
    [rules],
  );

  const toggle = async (roleCode: string, moduleId: string) => {
    const next = !allowedFor(roleCode, moduleId);
    const key = `${roleCode}:${moduleId}`;
    setPending(key);
    setError("");
    try {
      const response = await fetch("/api/module-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleCode, moduleId, allowed: next }),
      });
      const body = (await response.json().catch(() => null)) as { rule?: ModuleAccessRule; error?: string } | null;
      if (!response.ok || !body?.rule) throw new Error(body?.error ?? "Unable to update module access");
      const updated = body.rule;
      setRules((current) => {
        const others = current.filter((item) => !(item.roleCode === updated.roleCode && item.moduleId === updated.moduleId));
        return [...others, updated];
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update module access");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Module Access</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Role-based visibility control for every module. Unchecking a cell hides that module for that role. New role/module
          pairs default to allowed until explicitly restricted here.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-busy={loading}>
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="sticky left-0 z-10 bg-white px-4 py-2.5 dark:bg-zinc-900/50">Module</th>
                {GRID_ROLES.map((role) => (
                  <th key={role} className="px-4 py-2.5 text-center capitalize">{role}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => (
                <tr key={module.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                  <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-medium text-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200">
                    {module.name}
                  </td>
                  {GRID_ROLES.map((role) => {
                    const key = `${role}:${module.id}`;
                    const checked = allowedFor(role, module.id);
                    return (
                      <td key={role} className="px-4 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={loading || pending === key}
                          onChange={() => void toggle(role, module.id)}
                          aria-label={`${checked ? "Revoke" : "Grant"} ${role} access to ${module.name}`}
                          className="size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Shown in place of the grid when the signed-in role may not manage access. */
export function ModuleAccessGate() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">You don&apos;t have access to this section.</p>
    </div>
  );
}

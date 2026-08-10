"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import type { UserRole } from "@/lib/auth";

type ManagedUser = {
  id: string;
  username: string;
  displayName: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

const ROLE_OPTIONS: UserRole[] = ["god", "admin", "qa", "developer", "viewer"];

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export function UserManager() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/users");
      const body = (await response.json().catch(() => null)) as { users?: ManagedUser[]; error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "Unable to load users — sign in with a real account to manage users");
      setUsers(Array.isArray(body?.users) ? body.users : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load users — sign in with a real account to manage users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) =>
      [user.username, user.displayName ?? "", user.role].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [users, search]);

  const changeRole = async (user: ManagedUser, role: UserRole) => {
    if (role === user.role) return;
    setSavingId(user.id);
    setRowError((current) => ({ ...current, [user.id]: "" }));
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const body = (await response.json().catch(() => null)) as { user?: ManagedUser; error?: string } | null;
      if (!response.ok || !body?.user) throw new Error(body?.error ?? "Unable to update role");
      const updated = body.user;
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (cause) {
      setRowError((current) => ({
        ...current,
        [user.id]: cause instanceof Error ? cause.message : "Unable to update role",
      }));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Accounts in the profiles table, linked 1:1 to Supabase auth. {visible.length} of {users.length} shown.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </button>
          <span title="Account creation requires a Supabase service role key, which isn't configured in this environment. Ask users to sign up, or set SUPABASE_SERVICE_ROLE_KEY to enable this.">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
            >
              <Plus className="size-4" aria-hidden="true" />
              Create user
            </button>
          </span>
        </div>
      </div>

      <label className="relative block max-w-sm">
        <span className="sr-only">Search users</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search username, name, or role"
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </label>

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
                <th className="px-4 py-2.5">Username</th>
                <th className="px-4 py-2.5">Display Name</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Updated</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => (
                <tr key={user.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                  <td className="px-4 py-2.5 font-medium text-zinc-800 dark:text-zinc-200">{user.username}</td>
                  <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">{user.displayName ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={user.role}
                      disabled={savingId === user.id}
                      onChange={(event) => void changeRole(user, event.target.value as UserRole)}
                      aria-label={`Role for ${user.username}`}
                      className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    {rowError[user.id] ? (
                      <p role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400">{rowError[user.id]}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{formatDate(user.updatedAt)}</td>
                </tr>
              ))}
              {!loading && !visible.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    {users.length ? "No users match your search." : "No users to display."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

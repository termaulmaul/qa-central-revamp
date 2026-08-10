"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Self-service password change, ported from the reference's ChangeOwnPassword.
 *
 * The reference posts to an Oracle-backed `/api/auth/change-password`; this app
 * is on Supabase Auth, so the same UX is driven by the browser client instead:
 * `signInWithPassword` re-verifies the current password (Supabase's
 * `updateUser` does not check it), then `updateUser({ password })` applies the
 * new one.
 */
type Props = {
  email: string | null;
  /** Dev-bypass sessions have no Supabase auth user, so the API cannot work. */
  devBypass: boolean;
};

const POLICY_HINT = "8–72 characters with uppercase, lowercase, number, and special characters.";

/** Same policy the reference server route enforces, checked client-side here. */
function policyError(password: string): string {
  if (password.length < 8 || password.length > 72) return "New password must be 8–72 characters long";
  if (!/[a-z]/.test(password)) return "New password must contain a lowercase letter";
  if (!/[A-Z]/.test(password)) return "New password must contain an uppercase letter";
  if (!/[0-9]/.test(password)) return "New password must contain a number";
  if (!/[^A-Za-z0-9]/.test(password)) return "New password must contain a special character";
  return "";
}

function PasswordField({
  label,
  value,
  onChange,
  disabled,
  autoComplete,
  autoFocus,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  autoComplete: string;
  autoFocus?: boolean;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-3 pr-10 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </span>
      {hint ? <span className="text-xs text-zinc-400 dark:text-zinc-500">{hint}</span> : null}
    </label>
  );
}

export function ChangePassword({ email, devBypass }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [changed, setChanged] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New Password and Confirm New Password do not match");
      return;
    }
    const policy = policyError(newPassword);
    if (policy) {
      setError(policy);
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must differ from your current password");
      return;
    }
    if (!email) {
      setError("Your account has no email address on file, so the password cannot be verified");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      // Supabase's updateUser does not verify the current password, so
      // re-authenticate first to keep the reference's "current password"
      // guarantee.
      const reauth = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (reauth.error) throw new Error("Current password is incorrect");

      const updated = await supabase.auth.updateUser({ password: newPassword });
      if (updated.error) throw new Error(updated.error.message);
      setChanged(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Password change failed");
    } finally {
      setSaving(false);
    }
  };

  if (devBypass) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/20 dark:bg-amber-500/10">
        <h2 className="flex items-center gap-2 text-base font-semibold text-amber-900 dark:text-amber-200">
          <KeyRound className="size-4" aria-hidden="true" />
          Not available for the dev bypass session
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-800 dark:text-amber-300/90">
          You are signed in through the local dev bypass cookie, which is a synthetic session with no Supabase auth user
          behind it. There is no password to change. Sign in with a real account to change your password.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Account Password</h2>
      </div>
      <div className="p-4">
        {changed ? (
          <div className="flex flex-col gap-4">
            <p role="status" className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              <strong className="font-semibold">Password changed.</strong> Your new password is active on this account — use
              it the next time you sign in.
            </p>
            <button
              type="button"
              onClick={() => {
                setChanged(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="w-fit rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Change it again
            </button>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="flex max-w-md flex-col gap-4">
            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              disabled={saving}
              autoComplete="current-password"
              autoFocus
            />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              disabled={saving}
              autoComplete="new-password"
              hint={POLICY_HINT}
            />
            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              disabled={saving}
              autoComplete="new-password"
            />
            {error ? (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "Changing…" : "Change Password"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

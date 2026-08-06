"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { signIn } from "@/app/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A84FF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#005bac] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Signing in...
        </>
      ) : (
        "Sign in"
      )}
    </button>
  );
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction] = useActionState(signIn, { error: null });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="identifier"
          className="text-sm font-medium text-zinc-300"
        >
          Username
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="Enter your username"
          className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#0A84FF] focus:outline-none focus:ring-1 focus:ring-[#0A84FF]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-zinc-300">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 pr-10 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#0A84FF] focus:outline-none focus:ring-1 focus:ring-[#0A84FF]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton />

      <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-500">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Secured by Supabase Auth
      </p>
    </form>
  );
}

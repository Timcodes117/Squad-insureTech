"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const [accessCode, setAccessCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, session, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && session) router.replace("/dashboard");
  }, [session, ready, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(accessCode.trim());
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else if (err instanceof Error) setError(err.message);
      else setError("Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl mb-3">
            H
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">BetaHealth Hospital</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">Sign in with your hospital access code</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-1.5">
              Hospital access code
            </label>
            <input
              id="code"
              type="password"
              autoComplete="off"
              required
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="BHOSP-XXXXXXXX or API key"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Provided by BetaHealth when your hospital is onboarded. Session expires after 10 minutes of inactivity.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || !accessCode.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

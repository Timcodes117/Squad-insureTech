"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const [key, setKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, adminKey, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && adminKey) router.replace("/dashboard");
  }, [adminKey, ready, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(key.trim());
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 403 ? "Invalid admin key" : err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl mb-3">
            B
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">BetaHealth Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in with your admin key</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4"
        >
          <div>
            <label htmlFor="key" className="block text-sm font-medium text-slate-700 mb-1.5">
              Admin key
            </label>
            <input
              id="key"
              type="password"
              autoComplete="current-password"
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="local_dev_admin_key_change_me"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              The value of <code className="bg-slate-100 px-1 py-0.5 rounded">ADMIN_KEY</code> from the backend .env
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !key.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {submitting ? "Verifying…" : "Sign in"}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-6">
          The key is stored in your browser only — never sent anywhere except the BetaHealth API.
        </p>
      </div>
    </div>
  );
}

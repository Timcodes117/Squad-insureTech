"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { adminFetch } from "./api";

const STORAGE_KEY = "betahealth-admin-key";

interface AuthState {
  adminKey: string | null;
  ready: boolean;
  login: (key: string) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    setAdminKey(stored);
    setReady(true);
  }, []);

  const login = useCallback(async (key: string) => {
    // Validate the key by hitting /admin/stats. If it works, persist it.
    await adminFetch("/admin/stats", key);
    window.localStorage.setItem(STORAGE_KEY, key);
    setAdminKey(key);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setAdminKey(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ adminKey, ready, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// Utility for formatting kobo amounts to ₦ display.
export function formatNaira(kobo: number | null | undefined): string {
  if (kobo === null || kobo === undefined) return "—";
  return `₦${(kobo / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

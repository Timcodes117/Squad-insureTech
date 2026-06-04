"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { SESSION_IDLE_MS } from "./config";
import { hospitalAccessLogin, type HospitalSession } from "./api";

const STORAGE_KEY = "betahealth-hospital-session";
const PATIENT_KEY = "betahealth-verified-patient";

export interface VerifiedPatient {
  patient_id: string;
  first_name: string;
  coverage_status: string;
  available_cover_balance: number;
  active_plan_status: boolean;
  can_deduct_from_cover?: boolean;
  preAuthCode?: string;
  phone?: string;
}

interface AuthState {
  session: HospitalSession | null;
  verifiedPatient: VerifiedPatient | null;
  ready: boolean;
  login: (accessCode: string) => Promise<void>;
  logout: () => void;
  setVerifiedPatient: (p: VerifiedPatient | null) => void;
  touchSession: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<HospitalSession | null>(null);
  const [verifiedPatient, setVerifiedPatientState] = useState<VerifiedPatient | null>(null);
  const [ready, setReady] = useState(false);
  const lastActivity = useRef(Date.now());
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(PATIENT_KEY);
    setSession(null);
    setVerifiedPatientState(null);
  }, []);

  const touchSession = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const patientRaw = window.localStorage.getItem(PATIENT_KEY);
    if (raw) {
      try {
        setSession(JSON.parse(raw) as HospitalSession);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    if (patientRaw) {
      try {
        setVerifiedPatientState(JSON.parse(patientRaw) as VerifiedPatient);
      } catch {
        window.localStorage.removeItem(PATIENT_KEY);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!session) return undefined;

    const checkIdle = () => {
      if (Date.now() - lastActivity.current >= SESSION_IDLE_MS) {
        logout();
      }
    };

    idleTimer.current = setInterval(checkIdle, 30_000);
    const onActivity = () => touchSession();
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);

    return () => {
      if (idleTimer.current) clearInterval(idleTimer.current);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
    };
  }, [session, logout, touchSession]);

  const login = useCallback(async (accessCode: string) => {
    const next = await hospitalAccessLogin(accessCode);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    touchSession();
  }, [touchSession]);

  const setVerifiedPatient = useCallback((p: VerifiedPatient | null) => {
    setVerifiedPatientState(p);
    if (p) window.localStorage.setItem(PATIENT_KEY, JSON.stringify(p));
    else window.localStorage.removeItem(PATIENT_KEY);
  }, []);

  return (
    <AuthCtx.Provider
      value={{ session, verifiedPatient, ready, login, logout, setVerifiedPatient, touchSession }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function formatNaira(kobo: number | null | undefined): string {
  if (kobo === null || kobo === undefined) return "—";
  return `₦${(kobo / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

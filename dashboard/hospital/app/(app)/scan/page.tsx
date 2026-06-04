"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { ApiError, verifyPatientAccess } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PatientPreview } from "@/components/PatientPreview";

const QrScanner = dynamic(() => import("@/components/QrScanner").then((m) => m.QrScanner), {
  ssr: false,
  loading: () => <p className="text-sm text-slate-500 text-center py-8">Starting camera…</p>,
});

export default function ScanPage() {
  const { session, verifiedPatient, setVerifiedPatient, touchSession } = useAuth();
  const [accessId, setAccessId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"scan" | "manual">("scan");

  const verify = useCallback(
    async (payload: { accessToken?: string; accessId?: string }) => {
      if (!session) return;
      setLoading(true);
      setError(null);
      touchSession();
      try {
        const res = await verifyPatientAccess(session, payload);
        const p = res.data;
        setVerifiedPatient({
          patient_id: p.patient_id,
          first_name: p.first_name,
          coverage_status: p.coverage_status,
          available_cover_balance: p.available_cover_balance,
          active_plan_status: p.active_plan_status,
          can_deduct_from_cover: p.can_deduct_from_cover,
          preAuthCode: p.preAuthCode,
          phone: p.phone,
        });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Verification failed");
      } finally {
        setLoading(false);
      }
    },
    [session, setVerifiedPatient, touchSession]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Verify patient</h1>
        <p className="text-sm text-slate-500 mt-1">
          Scan the patient&apos;s BetaHealth QR or enter their membership access ID from their card.
        </p>
      </div>

      <div className="flex gap-2">
        <Tab active={mode === "scan"} onClick={() => setMode("scan")}>
          QR scan
        </Tab>
        <Tab active={mode === "manual"} onClick={() => setMode("manual")}>
          Manual ID
        </Tab>
      </div>

      {mode === "scan" ? (
        <QrScanner active={mode === "scan"} onScan={(text) => verify({ accessToken: text })} />
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            verify({ accessId: accessId.trim() });
          }}
        >
          <input
            value={accessId}
            onChange={(e) => setAccessId(e.target.value)}
            placeholder="BH-XXXXXXXXX"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono uppercase"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify access ID"}
          </button>
        </form>
      )}

      {loading && <p className="text-sm text-slate-500 text-center">Verifying patient access…</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {verifiedPatient && <PatientPreview patient={verifiedPatient} />}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 text-sm font-medium rounded-lg border ${
        active ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-white border-slate-200 text-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

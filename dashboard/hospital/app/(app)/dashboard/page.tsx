"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { hospitalApi, ApiError } from "@/lib/api";
import { formatNaira, useAuth } from "@/lib/auth";
import { PatientPreview } from "@/components/PatientPreview";
import { StatusBadge } from "@/components/Badge";

export default function DashboardPage() {
  const { session, verifiedPatient } = useAuth();
  const [recent, setRecent] = useState<{ id: string; amount: number; status: string; treatmentType: string }[]>([]);
  const [counts, setCounts] = useState({ pending: 0, paid: 0, flagged: 0 });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const res = await hospitalApi.listClaims(session, { limit: 8 });
      const items = res.data.items.map((c) => ({
        id: c.id || c._id || "",
        amount: c.amount,
        status: c.status,
        treatmentType: c.treatmentType,
      }));
      setRecent(items);
      setCounts({
        pending: res.data.items.filter((c) => c.status === "pending" || c.status === "approved").length,
        paid: res.data.items.filter((c) => c.status === "paid").length,
        flagged: res.data.items.filter((c) => c.status === "flagged").length,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load claims");
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Verify patients before every claim. No browsing of member records.</p>
      </div>

      {verifiedPatient ? (
        <PatientPreview patient={verifiedPatient} />
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-600">No patient verified in this session.</p>
          <Link href="/scan" className="inline-block mt-3 text-sm font-medium text-emerald-700 hover:underline">
            Scan QR or enter access ID →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Pending / approved" value={String(counts.pending)} />
        <Stat label="Paid" value={String(counts.paid)} />
        <Stat label="Flagged" value={String(counts.flagged)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-medium text-sm">Recent claims</h2>
          <Link href="/claims" className="text-xs text-emerald-700 font-medium">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500 p-4">No claims yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((c) => (
              <li key={c.id} className="px-4 py-3 flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.treatmentType}</p>
                  <p className="text-slate-500">{formatNaira(c.amount)}</p>
                </div>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

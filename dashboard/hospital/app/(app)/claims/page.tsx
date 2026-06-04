"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { hospitalApi, ApiError } from "@/lib/api";
import { formatNaira, useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/Badge";

const FILTERS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "paid", label: "Paid" },
  { key: "flagged", label: "Flagged" },
  { key: "rejected", label: "Rejected" },
];

export default function ClaimsPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<
    { id: string; amount: number; status: string; treatmentType: string; createdAt: string }[]
  >([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const res = await hospitalApi.listClaims(session, { limit: 50, status: status || undefined });
      let rows = res.data.items.map((c) => ({
        id: c.id || c._id || "",
        amount: c.amount,
        status: c.status,
        treatmentType: c.treatmentType,
        createdAt: c.createdAt,
      }));
      if (status) rows = rows.filter((c) => c.status === status);
      setItems(rows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load claims");
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Claims history</h1>
        <Link href="/claims/new" className="text-sm font-medium text-emerald-700 whitespace-nowrap">
          + New claim
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatus(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              status === f.key
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No claims match this filter.</p>
      ) : (
        <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/claims/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{c.treatmentType}</p>
                  <p className="text-xs text-slate-500">
                    {formatNaira(c.amount)} · {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

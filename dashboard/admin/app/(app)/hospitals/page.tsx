"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/Badge";

interface Hospital {
  _id: string;
  name: string;
  contactPhone?: string;
  email?: string;
  address?: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
  isActive: boolean;
  flagged?: boolean;
  flaggedAt?: string;
  flagReason?: string;
  createdAt: string;
}

interface ListResp {
  data: {
    items: Hospital[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
}

type Filter = "all" | "flagged" | "unverified";

export default function HospitalsPage() {
  const { adminKey } = useAuth();
  const [items, setItems] = useState<Hospital[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: 20 };
      if (filter === "flagged") params.flagged = true;
      if (filter === "unverified") params.verified = false;
      const res: ListResp = await adminApi.listHospitals(adminKey, params);
      setItems(res.data.items);
      setPages(res.data.pagination.pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load hospitals");
    } finally {
      setLoading(false);
    }
  }, [adminKey, filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function verify(id: string) {
    if (!adminKey) return;
    setActing(id);
    try {
      await adminApi.verifyHospital(adminKey, id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to verify");
    } finally {
      setActing(null);
    }
  }

  async function clearFlag(id: string) {
    if (!adminKey) return;
    setActing(id);
    try {
      await adminApi.clearHospitalFlag(adminKey, id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to clear flag");
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hospitals</h1>
          <p className="text-sm text-slate-500 mt-1">
            Verify partner clinics and review anomaly flags.
          </p>
        </div>

        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {([
            ["all", "All"],
            ["flagged", "Flagged"],
            ["unverified", "Unverified"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setFilter(key);
                setPage(1);
              }}
              className={[
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                filter === key
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Hospital</th>
                <th className="px-4 py-3 text-left font-medium">Bank account</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    No hospitals match this filter.
                  </td>
                </tr>
              ) : (
                items.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{h.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {h.email || "—"}
                        {h.contactPhone && ` · ${h.contactPhone}`}
                      </div>
                      {h.flagged && h.flagReason && (
                        <div className="text-xs text-red-700 mt-1 max-w-md">
                          ⚠ {h.flagReason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{h.accountName}</div>
                      <div className="text-xs text-slate-500 mt-0.5 font-mono">
                        {h.bankCode} · {h.accountNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex gap-1.5 flex-wrap">
                        {h.isVerified ? (
                          <Badge tone="green">verified</Badge>
                        ) : (
                          <Badge tone="amber">unverified</Badge>
                        )}
                        {!h.isActive && <Badge tone="slate">inactive</Badge>}
                        {h.flagged && <Badge tone="red">flagged</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-right space-x-2">
                      {!h.isVerified && (
                        <button
                          disabled={acting === h._id}
                          onClick={() => verify(h._id)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        >
                          Verify
                        </button>
                      )}
                      {h.flagged && (
                        <button
                          disabled={acting === h._id}
                          onClick={() => clearFlag(h._id)}
                          className="text-xs font-medium text-amber-700 hover:text-amber-800 disabled:opacity-50"
                        >
                          Clear flag
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <Pagination page={page} pages={pages} onChange={setPage} disabled={loading} />
      )}
    </div>
  );
}

function Pagination({
  page,
  pages,
  onChange,
  disabled,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-500">
      <div>
        Page {page} of {pages}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={disabled || page <= 1}
          className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={disabled || page >= pages}
          className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

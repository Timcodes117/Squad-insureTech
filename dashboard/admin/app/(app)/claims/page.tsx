"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, ApiError } from "@/lib/api";
import { formatNaira, useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/Badge";

interface Claim {
  _id: string;
  amount: number;
  amountCovered: number;
  amountGap: number;
  treatmentType: string;
  status: "paid" | "approved" | "rejected" | "flagged" | "pending";
  rejectionReason?: string;
  auditorChecks?: {
    coverageOk?: boolean;
    duplicateOk?: boolean;
    whitelistOk?: boolean;
    riskMatchOk?: boolean;
    cooldownOk?: boolean;
    notes?: string;
  };
  squadTransferStatus?: string;
  createdAt: string;
  userId?: { _id: string; fullName?: string; phone?: string; membershipNumber?: string };
  hospitalId?: { _id: string; name?: string; flagged?: boolean };
}

const STATUSES = [
  { key: "", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "approved", label: "Approved" },
  { key: "flagged", label: "Flagged" },
  { key: "rejected", label: "Rejected" },
];

export default function ClaimsPage() {
  const { adminKey } = useAuth();
  const [items, setItems] = useState<Claim[]>([]);
  const [status, setStatus] = useState("");
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
      const res: any = await adminApi.listClaims(adminKey, {
        page,
        limit: 20,
        status: status || undefined,
      });
      setItems(res.data.items);
      setPages(res.data.pagination.pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load claims");
    } finally {
      setLoading(false);
    }
  }, [adminKey, page, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: string) {
    if (!adminKey) return;
    setActing(id);
    try {
      await adminApi.approveClaim(adminKey, id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to approve");
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Claims</h1>
          <p className="text-sm text-slate-500 mt-1">
            Approve flagged claims, inspect auditor notes, track payout status.
          </p>
        </div>

        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setStatus(s.key);
                setPage(1);
              }}
              className={[
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                status === s.key
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              {s.label}
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
                <th className="px-4 py-3 text-left font-medium">Patient</th>
                <th className="px-4 py-3 text-left font-medium">Hospital</th>
                <th className="px-4 py-3 text-left font-medium">Treatment</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No claims match this filter.
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.userId?.fullName || "—"}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {c.userId?.phone}
                        {c.userId?.membershipNumber && (
                          <span className="ml-1 font-mono">· {c.userId.membershipNumber}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{c.hospitalId?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.treatmentType}</div>
                      {c.rejectionReason && (
                        <div className="text-xs text-red-600 mt-0.5 max-w-xs">
                          {c.rejectionReason}
                        </div>
                      )}
                      {c.auditorChecks?.notes && !c.rejectionReason && (
                        <div className="text-xs text-slate-500 mt-0.5 max-w-xs">
                          {c.auditorChecks.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-medium">{formatNaira(c.amount)}</div>
                      {c.status === "paid" && c.amountGap > 0 && (
                        <div className="text-xs text-amber-700 mt-0.5">
                          gap {formatNaira(c.amountGap)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                      {c.squadTransferStatus && c.status !== "paid" && (
                        <div className="text-xs text-slate-500 mt-1">
                          payout: {c.squadTransferStatus}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === "flagged" && (
                        <button
                          disabled={acting === c._id}
                          onClick={() => approve(c._id)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        >
                          Approve & pay
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
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div>
            Page {page} of {pages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={loading || page <= 1}
              className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={loading || page >= pages}
              className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

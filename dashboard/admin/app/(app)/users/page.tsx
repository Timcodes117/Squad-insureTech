"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, ApiError } from "@/lib/api";
import { formatNaira, useAuth } from "@/lib/auth";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";

interface User {
  _id: string;
  email: string;
  phone: string;
  fullName: string;
  membershipNumber?: string;
  isActive: boolean;
  riskTier: "low" | "medium" | "high";
  weeklyPremium: number;
  walletBalance: number;
  coverageRemaining: number;
  firstPremiumAt?: string | null;
  lastPremiumBurnAt?: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const { adminKey } = useAuth();
  const [items, setItems] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [funding, setFunding] = useState<User | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = await adminApi.listUsers(adminKey, {
        page,
        limit: 20,
        search: debounced || undefined,
      });
      setItems(res.data.items);
      setPages(res.data.pagination.pages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [adminKey, page, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-slate-500 mt-1">
            Search by phone, email, name or membership number. Fund a wallet in test mode with one click.
          </p>
        </div>
        <input
          type="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
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
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Membership</th>
                <th className="px-4 py-3 text-left font-medium">Tier</th>
                <th className="px-4 py-3 text-right font-medium">Wallet</th>
                <th className="px-4 py-3 text-right font-medium">Coverage left</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    {debounced ? `No users match "${debounced}"` : "No users yet."}
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.fullName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {u.phone} · {u.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{u.membershipNumber || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          u.riskTier === "high"
                            ? "red"
                            : u.riskTier === "medium"
                              ? "amber"
                              : "blue"
                        }
                      >
                        {u.riskTier}
                      </Badge>
                      <div className="text-xs text-slate-500 mt-1">
                        {formatNaira(u.weeklyPremium)}/wk
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatNaira(u.walletBalance)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatNaira(u.coverageRemaining)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.isActive ? "green" : "slate"}>
                        {u.isActive ? "active" : "inactive"}
                      </Badge>
                      {!u.firstPremiumAt && (
                        <div className="text-xs text-slate-500 mt-0.5">no premium yet</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setFunding(u)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        Fund wallet
                      </button>
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

      <FundModal
        user={funding}
        onClose={() => setFunding(null)}
        onDone={() => {
          setFunding(null);
          load();
        }}
      />
    </div>
  );
}

function FundModal({
  user,
  onClose,
  onDone,
}: {
  user: User | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { adminKey } = useAuth();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const premiumNaira = Math.max(user.weeklyPremium / 100, 500);
      setAmount(String(premiumNaira));
      setError(null);
    }
  }, [user]);

  if (!user) return null;

  const amountNaira = Number(amount);
  const amountKobo = Math.round(amountNaira * 100);
  const valid = Number.isFinite(amountNaira) && amountNaira > 0 && Number.isInteger(amountKobo);
  const projectedBalance = user.walletBalance + (valid ? amountKobo : 0);
  const willActivate = !user.isActive && projectedBalance >= user.weeklyPremium;

  async function submit() {
    if (!adminKey || !valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await adminApi.fundUser(adminKey, { userId: user!._id, amountKobo });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Funding failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title={`Fund ${user.fullName}'s wallet`}
      description="Test-mode top-up — same effect as a real Squad funding webhook."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Field label="Current balance" value={formatNaira(user.walletBalance)} />
          <Field label="Weekly premium" value={formatNaira(user.weeklyPremium)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₦)</label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="1000"
          />
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
            <span>= {formatNaira(amountKobo)} in kobo</span>
            <div className="flex gap-1.5">
              {[500, 1000, 5000].map((n) => (
                <button
                  key={n}
                  onClick={() => setAmount(String(n))}
                  className="text-blue-600 hover:text-blue-700"
                >
                  ₦{n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {valid && (
          <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
            New balance will be <strong>{formatNaira(projectedBalance)}</strong>
            {willActivate && " — this funding will activate the user."}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid || submitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Funding…" : "Fund wallet"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5">
      <div className="text-slate-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  );
}

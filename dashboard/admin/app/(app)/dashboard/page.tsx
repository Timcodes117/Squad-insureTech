"use client";

import { useEffect, useState } from "react";
import { adminApi, ApiError } from "@/lib/api";
import { formatNaira, useAuth } from "@/lib/auth";
import { StatCard } from "@/components/StatCard";

interface Stats {
  pool: { balance: number; platformBalance: number };
  users: { total: number; active: number; inactive: number };
  hospitals: { total: number; verified: number; flagged: number };
  claims: {
    total: number;
    paid: number;
    approved: number;
    flagged: number;
    rejected: number;
    totalPaidAmount: number;
  };
}

export default function DashboardPage() {
  const { adminKey } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminKey) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await adminApi.stats(adminKey);
        if (!cancelled) setStats(res.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load stats");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminKey]);

  return (
    <div className="space-y-8">
      <Header />

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !stats ? (
        <SkeletonGrid />
      ) : stats ? (
        <>
          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
              Pool wallet
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                label="Insurance pool float"
                value={formatNaira(stats.pool.balance)}
                hint="Funds claim payouts"
                tone="primary"
              />
              <StatCard
                label="Platform revenue"
                value={formatNaira(stats.pool.platformBalance)}
                hint="10% of every premium burn"
                tone="success"
              />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Users</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total" value={stats.users.total} />
              <StatCard label="Active" value={stats.users.active} tone="success" />
              <StatCard label="Inactive" value={stats.users.inactive} tone="warn" />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">
              Hospitals
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total" value={stats.hospitals.total} />
              <StatCard label="Verified" value={stats.hospitals.verified} tone="success" />
              <StatCard
                label="Flagged"
                value={stats.hospitals.flagged}
                hint={stats.hospitals.flagged > 0 ? "Review on Hospitals tab" : "All clear"}
                tone={stats.hospitals.flagged > 0 ? "danger" : "default"}
              />
            </div>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-3">Claims</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <StatCard label="Total" value={stats.claims.total} />
              <StatCard label="Paid" value={stats.claims.paid} tone="success" />
              <StatCard label="Approved" value={stats.claims.approved} tone="primary" />
              <StatCard label="Flagged" value={stats.claims.flagged} tone="warn" />
              <StatCard label="Rejected" value={stats.claims.rejected} tone="danger" />
            </div>
            <div className="mt-4">
              <StatCard
                label="Total paid out to date"
                value={formatNaira(stats.claims.totalPaidAmount)}
                tone="success"
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="text-sm text-slate-500 mt-1">
        Live snapshot of the BetaHealth platform.
      </p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((j) => (
            <div
              key={j}
              className="bg-white border border-slate-200 rounded-xl p-5 h-24 animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

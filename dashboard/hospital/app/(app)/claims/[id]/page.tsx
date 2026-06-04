"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { hospitalApi, ApiError, type ClaimItem } from "@/lib/api";
import { formatNaira, useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/Badge";

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const [claim, setClaim] = useState<ClaimItem | null>(null);
  const [timeline, setTimeline] = useState<{ at: string; status: string; note?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !id) return;
    try {
      const res = await hospitalApi.getClaim(session, id);
      setClaim(res.data.claim);
      setTimeline(res.data.timeline || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load claim");
    }
  }, [session, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-red-600 text-sm">{error}</p>
        <Link href="/claims" className="text-sm text-emerald-700">
          ← Back to claims
        </Link>
      </div>
    );
  }

  if (!claim) return <p className="text-sm text-slate-500">Loading claim…</p>;

  return (
    <div className="space-y-6">
      <Link href="/claims" className="text-sm text-emerald-700">
        ← Claims
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{claim.treatmentType}</h1>
          <p className="text-sm text-slate-500 mt-1">{formatNaira(claim.amount)} billed</p>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Card label="Covered" value={formatNaira(claim.amountCovered)} />
        <Card label="Patient gap" value={formatNaira(claim.amountGap)} />
        <Card label="Transfer" value={claim.squadTransferStatus || "—"} />
        <Card label="Paid at" value={claim.paidAt ? new Date(claim.paidAt).toLocaleString() : "—"} />
      </dl>

      {claim.clinicalNote && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm">
          <p className="text-xs text-slate-500 mb-1">Treatment notes</p>
          <p>{claim.clinicalNote}</p>
        </div>
      )}

      {(claim.status === "flagged" || claim.status === "rejected") && claim.rejectionReason && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          <p className="font-medium text-xs uppercase tracking-wide mb-1">Admin / auditor notes</p>
          <p>{claim.rejectionReason}</p>
        </div>
      )}

      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="font-medium text-sm mb-4">Status timeline</h2>
        <ol className="space-y-4 border-l-2 border-slate-200 ml-2 pl-4">
          {timeline.map((ev, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[1.3rem] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-sm font-medium capitalize">{ev.status}</p>
              <p className="text-xs text-slate-500">{new Date(ev.at).toLocaleString()}</p>
              {ev.note && <p className="text-xs text-slate-600 mt-0.5">{ev.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      <div className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg p-3">
        Cover deduction:{" "}
        {claim.status === "paid"
          ? `${formatNaira(claim.amountCovered)} deducted from member cover.`
          : claim.status === "flagged"
            ? "Pending review — cover not yet deducted."
            : claim.status === "rejected"
              ? "No cover deduction."
              : "Processing…"}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium mt-0.5">{value}</dd>
    </div>
  );
}

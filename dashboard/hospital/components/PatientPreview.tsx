"use client";

import Link from "next/link";
import { formatNaira, type VerifiedPatient } from "@/lib/auth";
import { Badge } from "./Badge";

export function PatientPreview({ patient }: { patient: VerifiedPatient }) {
  const coverageTone =
    patient.coverage_status === "active"
      ? "green"
      : patient.coverage_status === "exhausted"
        ? "amber"
        : "red";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Verified patient</p>
          <h2 className="text-xl font-semibold mt-0.5">{patient.first_name}</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">ID {patient.patient_id.slice(-8)}</p>
        </div>
        <Badge tone={coverageTone}>{patient.coverage_status}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
          <dt className="text-slate-500 text-xs">Cover balance</dt>
          <dd className="font-semibold mt-1">{formatNaira(patient.available_cover_balance)}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
          <dt className="text-slate-500 text-xs">Plan status</dt>
          <dd className="font-semibold mt-1">{patient.active_plan_status ? "Active" : "Inactive"}</dd>
        </div>
      </dl>

      {patient.preAuthCode && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Pre-auth code issued to patient: <span className="font-mono font-bold">{patient.preAuthCode}</span>
          <p className="text-xs mt-1 text-emerald-700">Ask the patient to confirm this code before submitting a claim.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/claims/new"
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white text-sm font-medium px-4 py-2 hover:bg-emerald-700"
        >
          Submit claim
        </Link>
        {!patient.can_deduct_from_cover && (
          <span className="text-xs text-amber-700 self-center">Insufficient cover — claim may be flagged</span>
        )}
      </div>
    </div>
  );
}

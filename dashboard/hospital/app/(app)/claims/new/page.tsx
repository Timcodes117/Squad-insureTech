"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { hospitalApi, ApiError } from "@/lib/api";
import { formatNaira, useAuth } from "@/lib/auth";
import { PatientPreview } from "@/components/PatientPreview";

export default function NewClaimPage() {
  const { session, verifiedPatient, touchSession } = useAuth();
  const router = useRouter();
  const [amountNaira, setAmountNaira] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentDescription, setTreatmentDescription] = useState("");
  const [preAuthCode, setPreAuthCode] = useState(verifiedPatient?.preAuthCode || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const amountKobo = Math.round(parseFloat(amountNaira || "0") * 100);
  const canCover =
    verifiedPatient?.can_deduct_from_cover &&
    verifiedPatient.available_cover_balance >= amountKobo;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session || !verifiedPatient?.phone) {
      setError("Verify a patient first (scan or manual ID).");
      return;
    }
    if (!preAuthCode.trim()) {
      setError("Patient pre-auth code is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    touchSession();

    try {
      const res = (await hospitalApi.createClaim(session, {
          phone: verifiedPatient.phone,
          patient_id: verifiedPatient.patient_id,
          hospital_id: session.hospitalId,
          amount: amountKobo,
          treatmentType: diagnosis,
          diagnosis,
          treatment_description: treatmentDescription,
          clinicalNote: treatmentDescription,
          preAuthCode: preAuthCode.trim(),
        })) as {
        data?: { claim?: { id?: string; status?: string }; decision?: string; gap?: { message?: string } };
        message?: string;
      };

      const claim = res.data?.claim;
      const decision = res.data?.decision || claim?.status;
      setSuccess(res.message || `Claim ${decision}. ${res.data?.gap?.message || ""}`);
      if (claim?.id) {
        setTimeout(() => router.push(`/claims/${claim.id}`), 1200);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  }

  if (!verifiedPatient) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">New claim</h1>
        <p className="text-sm text-slate-600">You must verify a patient before submitting a claim.</p>
        <Link href="/scan" className="inline-block text-emerald-700 font-medium text-sm">
          Go to patient verification →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Submit claim</h1>
      <PatientPreview patient={verifiedPatient} />

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        <Field label="Amount (₦)">
          <input
            type="number"
            min="1"
            step="0.01"
            required
            value={amountNaira}
            onChange={(e) => setAmountNaira(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </Field>

        {amountKobo > 0 && (
          <p
            className={`text-xs rounded-lg px-3 py-2 border ${
              canCover ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            {canCover
              ? `Cover balance (${formatNaira(verifiedPatient.available_cover_balance)}) can cover this claim.`
              : `Insufficient cover — claim may be flagged. Balance: ${formatNaira(verifiedPatient.available_cover_balance)}`}
          </p>
        )}

        <Field label="Diagnosis / treatment type">
          <input
            required
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="e.g. Outpatient consultation"
          />
        </Field>

        <Field label="Treatment description">
          <textarea
            value={treatmentDescription}
            onChange={(e) => setTreatmentDescription(e.target.value)}
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Brief clinical summary"
          />
        </Field>

        <Field label="Patient pre-auth code">
          <input
            required
            value={preAuthCode}
            onChange={(e) => setPreAuthCode(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono uppercase"
            placeholder="6-character code from patient"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-700">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit claim"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

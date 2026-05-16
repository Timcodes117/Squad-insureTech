"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";

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
  const [adding, setAdding] = useState(false);
  const [createdKey, setCreatedKey] = useState<{ apiKey: string; name: string } | null>(null);

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

        <div className="flex items-center gap-3 flex-wrap">
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
          <button
            onClick={() => setAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add hospital
          </button>
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

      <CreateHospitalModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(apiKey, name) => {
          setAdding(false);
          setCreatedKey({ apiKey, name });
          load();
        }}
      />
      <CreatedKeyModal
        info={createdKey}
        onClose={() => setCreatedKey(null)}
      />
    </div>
  );
}

function CreateHospitalModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (apiKey: string, name: string) => void;
}) {
  const { adminKey } = useAuth();
  const [form, setForm] = useState({
    name: "",
    contactPhone: "",
    email: "",
    address: "",
    bankCode: "000013",
    accountNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setForm({
        name: "",
        contactPhone: "",
        email: "",
        address: "",
        bankCode: "000013",
        accountNumber: "",
      });
    }
  }, [open]);

  const canSubmit =
    form.name.trim().length > 1 &&
    /^\d{6}$/.test(form.bankCode) &&
    /^\d{10}$/.test(form.accountNumber);

  async function submit() {
    if (!adminKey || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res: any = await adminApi.createHospital(adminKey, {
        name: form.name.trim(),
        contactPhone: form.contactPhone.trim() || undefined,
        email: form.email.trim().toLowerCase() || undefined,
        address: form.address.trim() || undefined,
        bankCode: form.bankCode,
        accountNumber: form.accountNumber,
      });
      onCreated(res.data.apiKey, res.data.hospital.name);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create hospital");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add hospital"
      description="Creates a pre-verified hospital and generates an API key for them."
      maxWidth="lg"
    >
      <div className="space-y-4">
        <FormRow
          label="Hospital name"
          required
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholder="e.g. St Mary's Clinic"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormRow
            label="Contact phone"
            value={form.contactPhone}
            onChange={(v) => setForm((f) => ({ ...f, contactPhone: v }))}
            placeholder="08012345678"
          />
          <FormRow
            label="Email"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            placeholder="ops@hospital.com"
            type="email"
          />
        </div>
        <FormRow
          label="Address"
          value={form.address}
          onChange={(v) => setForm((f) => ({ ...f, address: v }))}
          placeholder="Street, City"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormRow
            label="Bank NIP code"
            required
            value={form.bankCode}
            onChange={(v) => setForm((f) => ({ ...f, bankCode: v.replace(/\D/g, "").slice(0, 6) }))}
            placeholder="000013"
            mono
            hint="6-digit Squad NIP. GTBank = 000013, Access = 000014, Zenith = 000015"
          />
          <FormRow
            label="Account number"
            required
            value={form.accountNumber}
            onChange={(v) => setForm((f) => ({ ...f, accountNumber: v.replace(/\D/g, "").slice(0, 10) }))}
            placeholder="0123456789"
            mono
            hint="10 digits"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit || submitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating…" : "Create hospital"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreatedKeyModal({
  info,
  onClose,
}: {
  info: { apiKey: string; name: string } | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!info) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(info!.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <Modal
      open={!!info}
      onClose={onClose}
      title={`${info.name} created`}
      description="Copy this API key NOW — it's the only time you'll see it."
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800">
          The hospital uses this key as the <code className="font-mono">x-hospital-api-key</code> header on every request. Send it through a secure channel — never email or chat.
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
            API key
          </label>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs break-all">
            {info.apiKey}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={copy}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg"
          >
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
          <button onClick={onClose} className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg">
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

function FormRow({
  label,
  value,
  onChange,
  placeholder,
  required,
  type,
  mono,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          mono ? "font-mono" : "",
        ].join(" ")}
      />
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
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

import { API_BASE_URL } from "./config";

function maskFirstName(fullName: string) {
  const first = fullName.trim().split(/\s+/)[0] || "Patient";
  if (first.length <= 1) return `${first}***`;
  return `${first.charAt(0)}${"*".repeat(Math.min(first.length - 1, 4))}`;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type Method = "GET" | "POST";

interface RequestOptions {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildQuery(query?: RequestOptions["query"]) {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export interface HospitalSession {
  hospitalId: string;
  hospitalName: string;
  authToken: string;
  permissions: string[];
}

export interface LimitedPatient {
  patient_id: string;
  first_name: string;
  coverage_status: string;
  available_cover_balance: number;
  active_plan_status: boolean;
  can_deduct_from_cover?: boolean;
  verification_session?: string;
  preAuthCode?: string;
  preAuthExpiresAt?: string;
  phone?: string;
}

export interface ClaimItem {
  id?: string;
  _id?: string;
  amount: number;
  amountCovered?: number;
  amountGap?: number;
  treatmentType: string;
  clinicalNote?: string;
  status: string;
  rejectionReason?: string;
  auditorChecks?: Record<string, unknown>;
  squadTransferStatus?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
  userId?: { fullName?: string; phone?: string };
}

export async function hospitalFetch<T = unknown>(
  path: string,
  session: HospitalSession,
  opts: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}${buildQuery(opts.query)}`;
  const headers: Record<string, string> = {
    "x-hospital-id": session.hospitalId,
  };
  if (session.authToken.startsWith("hosp_")) {
    headers["x-hospital-api-key"] = session.authToken;
  } else {
    headers.Authorization = `Bearer ${session.authToken}`;
  }
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  let parsed: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
  }

  if (!res.ok) {
    const msg =
      (parsed as { error?: string })?.error ||
      (parsed as { message?: string })?.message ||
      `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, parsed);
  }
  return parsed as T;
}

export async function hospitalAccessLogin(accessCode: string): Promise<HospitalSession> {
  const res = await fetch(`${API_BASE_URL}/hospital/access-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessCode: accessCode.trim() }),
    cache: "no-store",
  });

  let parsed: Record<string, unknown> = {};
  const text = await res.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }
  }

  if (res.ok && parsed?.data) {
    const data = parsed.data as Record<string, unknown>;
    return {
      hospitalId: String(data.hospital_id),
      hospitalName: String((data.hospital as { name?: string })?.name || "Hospital"),
      authToken: String(data.auth_token),
      permissions: (data.permissions as string[]) || ["hospital_staff"],
    };
  }

  // Fallback: treat access code as legacy API key until access-login is deployed.
  const probe = await fetch(`${API_BASE_URL}/hospital/claims?limit=1`, {
    headers: { "x-hospital-api-key": accessCode.trim() },
    cache: "no-store",
  });
  if (!probe.ok) {
    throw new ApiError("Invalid hospital access code", res.status || probe.status, parsed);
  }
  return {
    hospitalId: "unknown",
    hospitalName: "Hospital",
    authToken: accessCode.trim(),
    permissions: ["hospital_staff"],
  };
}

export async function verifyPatientAccess(
  session: HospitalSession,
  body: { accessToken?: string; accessId?: string; phone?: string }
): Promise<{ success: boolean; data: LimitedPatient }> {
  try {
    return await hospitalFetch("/patient/verify-access", session, { method: "POST", body });
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 404) throw err;
  }

  const membership = body.accessId?.trim();
  const phone = body.phone?.trim();
  const qrToken = body.accessToken?.trim();

  let lookupQuery: Record<string, string> = {};
  if (qrToken?.match(/^BH-[0-9A-Z]{9}$/i)) {
    lookupQuery = { membership: qrToken.toUpperCase() };
  } else if (membership) {
    lookupQuery = { membership: membership.toUpperCase() };
  } else if (phone) {
    lookupQuery = { phone };
  } else if (qrToken) {
    lookupQuery = { membership: qrToken.toUpperCase() };
  } else {
    throw new ApiError("Provide QR token, membership ID, or phone", 400, null);
  }

  const lookup = await hospitalFetch<{ data: Record<string, unknown> }>(
    "/hospital/users/lookup",
    session,
    { query: lookupQuery }
  );
  const d = lookup.data;
  const active = Boolean(d.isActive);
  return {
    success: true,
    data: {
      patient_id: String(d.id || ""),
      first_name: maskFirstName(String(d.fullName || "Patient")),
      coverage_status:
        Number(d.coverageRemaining) <= 0 ? "exhausted" : active ? "active" : "inactive",
      available_cover_balance: Number(d.coverageRemaining || 0),
      active_plan_status: active,
      can_deduct_from_cover: active && Number(d.coverageRemaining) > 0,
      preAuthCode: String(d.preAuthCode || ""),
      preAuthExpiresAt: d.preAuthExpiresAt ? String(d.preAuthExpiresAt) : undefined,
      phone: String(d.phone || ""),
    },
  };
}

export const hospitalApi = {
  listClaims: (
    session: HospitalSession,
    params: { page?: number; limit?: number; status?: string } = {}
  ) => hospitalFetch<{ data: { items: ClaimItem[]; pagination: { pages: number; total: number } } }>(
    "/hospital/claims",
    session,
    { query: params }
  ),

  getClaim: (session: HospitalSession, claimId: string) =>
    hospitalFetch<{ data: { claim: ClaimItem; timeline: { at: string; status: string; note?: string }[] } }>(
      `/hospital/claims/${claimId}`,
      session
    ).catch(async () => {
      const list = await hospitalApi.listClaims(session, { limit: 100 });
      const found = list.data.items.find((c) => (c.id || c._id) === claimId);
      if (!found) throw new ApiError("Claim not found", 404, null);
      return {
        data: {
          claim: found,
          timeline: buildClaimTimeline(found),
        },
      };
    }),

  createClaim: (
    session: HospitalSession,
    body: {
      phone: string;
      amount: number;
      treatmentType: string;
      clinicalNote?: string;
      preAuthCode: string;
      patient_id?: string;
      hospital_id?: string;
      diagnosis?: string;
      treatment_description?: string;
    }
  ) => {
    const payload = {
      phone: body.phone,
      amount: body.amount,
      treatmentType: body.diagnosis || body.treatmentType,
      clinicalNote: body.treatment_description || body.clinicalNote || "",
      preAuthCode: body.preAuthCode,
    };
    return hospitalFetch("/hospital/claims", session, { method: "POST", body: payload }).catch(
      () =>
        hospitalFetch("/claims/create", session, {
          method: "POST",
          body: { ...body, ...payload, hospital_id: session.hospitalId, patient_id: body.patient_id },
        })
    );
  },
};

function buildClaimTimeline(claim: ClaimItem) {
  const events: { at: string; status: string; note?: string }[] = [
    { at: claim.createdAt, status: "submitted", note: "Claim submitted to BetaHealth" },
  ];
  if (claim.status === "flagged") {
    events.push({
      at: claim.updatedAt || claim.createdAt,
      status: "flagged",
      note: claim.rejectionReason || "Under manual review",
    });
  }
  if (claim.status === "rejected") {
    events.push({
      at: claim.updatedAt || claim.createdAt,
      status: "rejected",
      note: claim.rejectionReason,
    });
  }
  if (claim.status === "approved" || claim.status === "paid") {
    events.push({ at: claim.updatedAt || claim.createdAt, status: "approved" });
  }
  if (claim.status === "paid" && claim.paidAt) {
    events.push({ at: claim.paidAt, status: "paid", note: "Cover deduction settled" });
  }
  return events;
}

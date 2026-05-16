import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type Method = "GET" | "POST" | "DELETE";

interface RequestOptions {
  method?: Method;
  body?: any;
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

export async function adminFetch<T = any>(
  path: string,
  adminKey: string,
  opts: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}${buildQuery(opts.query)}`;
  const headers: Record<string, string> = {
    "x-admin-key": adminKey,
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  let parsed: any = null;
  const text = await res.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
  }

  if (!res.ok) {
    const msg = parsed?.error || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, parsed);
  }
  return parsed as T;
}

// Convenience helpers — typed-loosely on purpose, the dashboard is small.
export const adminApi = {
  stats: (key: string) => adminFetch("/admin/stats", key),
  pool: (key: string) => adminFetch("/admin/pool", key),
  listUsers: (key: string, params: { page?: number; limit?: number; search?: string } = {}) =>
    adminFetch("/admin/users", key, { query: params }),
  listHospitals: (
    key: string,
    params: { page?: number; limit?: number; flagged?: boolean; verified?: boolean } = {}
  ) => adminFetch("/admin/hospitals", key, { query: params as any }),
  listClaims: (key: string, params: { page?: number; limit?: number; status?: string } = {}) =>
    adminFetch("/admin/claims", key, { query: params }),

  createHospital: (
    key: string,
    body: {
      name: string;
      contactPhone?: string;
      email?: string;
      address?: string;
      bankCode: string;
      accountNumber: string;
      accountName?: string;
    }
  ) => adminFetch("/admin/hospitals", key, { method: "POST", body }),
  verifyHospital: (key: string, id: string) =>
    adminFetch(`/admin/hospitals/${id}/verify`, key, { method: "POST" }),
  clearHospitalFlag: (key: string, id: string) =>
    adminFetch(`/admin/hospitals/${id}/clear-flag`, key, { method: "POST" }),
  approveClaim: (key: string, id: string) =>
    adminFetch(`/admin/claims/${id}/approve`, key, { method: "POST" }),
  fundUser: (
    key: string,
    body: { userId?: string; phone?: string; membership?: string; amountKobo: number }
  ) => adminFetch("/admin/dev/fund-user", key, { method: "POST", body }),

  runPremiumBurn: (key: string, body: { userId?: string } = {}) =>
    adminFetch("/admin/jobs/run-premium-burn", key, { method: "POST", body }),
  runCoverageReset: (key: string, body: { userId?: string } = {}) =>
    adminFetch("/admin/jobs/run-coverage-reset", key, { method: "POST", body }),
  runAnomalyScan: (key: string, body: { hospitalId?: string } = {}) =>
    adminFetch("/admin/jobs/run-hospital-anomaly-scan", key, { method: "POST", body }),
};

export async function publicFetch<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
  const body = await res.json();
  return body as T;
}

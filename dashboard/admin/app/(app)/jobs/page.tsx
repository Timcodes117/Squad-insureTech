"use client";

import { useState } from "react";
import { adminApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type JobKey = "premiumBurn" | "coverageReset" | "anomalyScan";

interface JobMeta {
  key: JobKey;
  title: string;
  description: string;
  schedule: string;
  cta: string;
  icon: React.ReactNode;
  accent: string;
}

const JOBS: JobMeta[] = [
  {
    key: "premiumBurn",
    title: "Premium burn",
    description:
      "Charges this week's premium for every active user whose last burn was 6+ days ago. Splits 90% to the pool, 10% to platform.",
    schedule: "Daily 09:00 Africa/Lagos",
    cta: "Run premium burn",
    accent: "bg-blue-600 hover:bg-blue-700",
    icon: (
      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: "coverageReset",
    title: "Coverage reset",
    description:
      "Refreshes coverageRemaining for users whose 30-day rolling cycle has elapsed. Idempotent — only resets users actually due.",
    schedule: "Daily 00:30 Africa/Lagos",
    cta: "Run coverage reset",
    accent: "bg-green-600 hover:bg-green-700",
    icon: (
      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    key: "anomalyScan",
    title: "Hospital anomaly scan",
    description:
      "Flags hospitals whose 24h activity exceeds 3× their 7-day daily average. Hospitals under 3 days old are skipped to avoid false positives.",
    schedule: "Daily 01:00 Africa/Lagos",
    cta: "Run anomaly scan",
    accent: "bg-amber-600 hover:bg-amber-700",
    icon: (
      <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
];

interface RunResult {
  key: JobKey;
  startedAt: Date;
  durationMs: number;
  data: any;
  error?: string;
}

export default function JobsPage() {
  const { adminKey } = useAuth();
  const [running, setRunning] = useState<JobKey | null>(null);
  const [history, setHistory] = useState<RunResult[]>([]);

  async function run(key: JobKey) {
    if (!adminKey || running) return;
    setRunning(key);
    const start = Date.now();
    try {
      let res: any;
      if (key === "premiumBurn") res = await adminApi.runPremiumBurn(adminKey);
      else if (key === "coverageReset") res = await adminApi.runCoverageReset(adminKey);
      else res = await adminApi.runAnomalyScan(adminKey);

      setHistory((prev) => [
        {
          key,
          startedAt: new Date(start),
          durationMs: Date.now() - start,
          data: res.data,
        },
        ...prev,
      ].slice(0, 10));
    } catch (err) {
      setHistory((prev) => [
        {
          key,
          startedAt: new Date(start),
          durationMs: Date.now() - start,
          data: null,
          error: err instanceof ApiError ? err.message : "Job failed",
        },
        ...prev,
      ].slice(0, 10));
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manual triggers for the three background workers. Use these for demos and ops
          intervention — the real cron runs on schedule automatically when Redis is
          configured.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {JOBS.map((job) => (
          <div
            key={job.key}
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center">
                {job.icon}
              </div>
              <span className="text-xs text-slate-500 px-2 py-1 bg-slate-50 rounded-md border border-slate-200">
                {job.schedule}
              </span>
            </div>
            <h2 className="font-semibold">{job.title}</h2>
            <p className="text-sm text-slate-500 mt-1 flex-1">{job.description}</p>
            <button
              onClick={() => run(job.key)}
              disabled={running !== null}
              className={[
                "mt-4 text-white font-medium text-sm py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2",
                job.accent,
              ].join(" ")}
            >
              {running === job.key ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Running…
                </>
              ) : (
                job.cta
              )}
            </button>
          </div>
        ))}
      </div>

      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Recent runs
          </h2>
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center text-sm text-slate-500">
            No jobs run yet in this session. Click one of the cards above.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((r, i) => (
              <RunCard key={i} run={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RunCard({ run }: { run: RunResult }) {
  const meta = JOBS.find((j) => j.key === run.key);
  const isError = Boolean(run.error);
  return (
    <div
      className={[
        "bg-white border rounded-xl overflow-hidden",
        isError ? "border-red-200" : "border-slate-200",
      ].join(" ")}
    >
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={[
              "h-2 w-2 rounded-full",
              isError ? "bg-red-500" : "bg-green-500",
            ].join(" ")}
          />
          <div>
            <div className="font-medium text-sm">{meta?.title}</div>
            <div className="text-xs text-slate-500">
              {run.startedAt.toLocaleTimeString()} · {run.durationMs}ms
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          {isError ? "Failed" : summarize(run.key, run.data)}
        </div>
      </div>
      {isError ? (
        <div className="p-4 text-sm text-red-700 bg-red-50">{run.error}</div>
      ) : (
        <pre className="p-4 text-xs font-mono text-slate-700 bg-slate-50 overflow-x-auto max-h-72">
          {JSON.stringify(run.data, null, 2)}
        </pre>
      )}
    </div>
  );
}

function summarize(key: JobKey, data: any): string {
  if (!data) return "No data";
  if (key === "premiumBurn") {
    return `${data.burned ?? 0} burned · ${data.paused ?? 0} paused · ${data.skipped ?? 0} skipped`;
  }
  if (key === "coverageReset") {
    return `${data.reset ?? 0} reset · ${data.scanned ?? 0} scanned`;
  }
  if (key === "anomalyScan") {
    return `${data.flagged ?? 0} flagged · ${data.scanned ?? 0} scanned`;
  }
  return "";
}

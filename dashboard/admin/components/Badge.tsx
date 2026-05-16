type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "slate";

const TONES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 border border-slate-200",
  blue: "bg-blue-50 text-blue-700 border border-blue-200",
  green: "bg-green-50 text-green-700 border border-green-200",
  amber: "bg-amber-50 text-amber-700 border border-amber-200",
  red: "bg-red-50 text-red-700 border border-red-200",
  slate: "bg-slate-100 text-slate-600 border border-slate-200",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, Tone> = {
  paid: "green",
  approved: "blue",
  pending: "slate",
  flagged: "amber",
  rejected: "red",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONES[status] || "neutral"}>{status}</Badge>;
}

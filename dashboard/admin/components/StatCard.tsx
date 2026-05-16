interface Props {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "primary" | "success" | "warn" | "danger";
}

export function StatCard({ label, value, hint, tone = "default" }: Props) {
  const toneClass = {
    default: "text-slate-900",
    primary: "text-blue-700",
    success: "text-green-700",
    warn: "text-amber-700",
    danger: "text-red-700",
  }[tone];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

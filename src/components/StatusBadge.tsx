import type { InsightSeverity, MetricStatus } from "@/types";
import { statusClass, statusLabel } from "@/lib/format";

export function StatusBadge({ status }: { status: MetricStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(status)}`}>
      {statusLabel(status)}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: InsightSeverity }) {
  const label = {
    info: "提示",
    warning: "关注",
    critical: "风险"
  }[severity];

  const className = {
    info: "border-slate-200 bg-slate-50 text-slate-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    critical: "border-rose-200 bg-rose-50 text-rose-700"
  }[severity];

  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>;
}

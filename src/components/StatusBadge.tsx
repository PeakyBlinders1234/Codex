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
    info: "border-slate-400/30 bg-slate-400/10 text-muted",
    warning: "border-amber-400/35 bg-amber-400/10 text-warning",
    critical: "border-rose-400/35 bg-rose-400/10 text-danger"
  }[severity];

  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>;
}

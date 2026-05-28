import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Metric } from "@/types";
import { StatusBadge } from "./StatusBadge";

export function KpiGrid({
  metrics,
  limit,
  compact = false,
  selectedMetricId,
  onSelectMetric
}: {
  metrics: Metric[];
  limit?: number;
  compact?: boolean;
  selectedMetricId?: string | null;
  onSelectMetric?: (metric: Metric) => void;
}) {
  const visibleMetrics = typeof limit === "number" ? metrics.slice(0, limit) : metrics;

  return (
    <section className={`grid gap-3 ${compact ? "md:grid-cols-4" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
      {visibleMetrics.map((metric) => {
        const positiveForBusiness =
          metric.goodDirection === "up" ? metric.changeRate >= 0 : metric.changeRate <= 0;
        const TrendIcon = metric.changeRate >= 0 ? ArrowUpRight : ArrowDownRight;
        const selected = selectedMetricId === metric.id;
        const Element = onSelectMetric ? "button" : "article";

        return (
          <Element
            key={metric.id}
            type={onSelectMetric ? "button" : undefined}
            onClick={onSelectMetric ? () => onSelectMetric(metric) : undefined}
            className={`dashboard-panel w-full rounded-lg p-4 text-left transition ${
              selected ? "border-accent bg-[rgba(var(--accent-rgb),0.12)] shadow-[0_0_32px_rgba(var(--accent-rgb),0.16)]" : "hover:border-accent"
            } ${compact ? "min-h-[132px]" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted">{metric.name}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className={`truncate font-semibold text-ink ${compact ? "text-xl" : "text-2xl"}`}>{metric.formattedValue}</p>
                  <span className="text-xs text-muted">{metric.unit}</span>
                </div>
              </div>
              <StatusBadge status={metric.status} />
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium ${
                  positiveForBusiness ? "bg-emerald-400/10 text-success" : "bg-rose-400/10 text-danger"
                }`}
              >
                <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {metric.changeLabel}
              </span>
              <span className="text-muted">较上一周期</span>
            </div>
            {compact ? null : <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted">{metric.definition}</p>}
          </Element>
        );
      })}
    </section>
  );
}

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Metric } from "@/types";
import { StatusBadge } from "./StatusBadge";

export function KpiGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => {
        const positiveForBusiness =
          metric.goodDirection === "up" ? metric.changeRate >= 0 : metric.changeRate <= 0;
        const TrendIcon = metric.changeRate >= 0 ? ArrowUpRight : ArrowDownRight;

        return (
          <article key={metric.id} className="rounded-lg border border-line bg-white p-4 shadow-panel">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted">{metric.name}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="truncate text-2xl font-semibold text-ink">{metric.formattedValue}</p>
                  <span className="text-xs text-muted">{metric.unit}</span>
                </div>
              </div>
              <StatusBadge status={metric.status} />
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium ${
                  positiveForBusiness ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
              >
                <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {metric.changeLabel}
              </span>
              <span className="text-muted">较上一周期</span>
            </div>
            <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted">{metric.definition}</p>
          </article>
        );
      })}
    </section>
  );
}

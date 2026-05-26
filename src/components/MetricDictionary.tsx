import { Database } from "lucide-react";
import type { Metric } from "@/types";
import { StatusBadge } from "./StatusBadge";

export function MetricDictionary({ metrics }: { metrics: Metric[] }) {
  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
      <div className="mb-4 flex items-center gap-2">
        <Database className="h-5 w-5 text-accent" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold text-ink">指标口径与 SQL</h2>
          <p className="text-xs text-muted">面试时可展开说明数据分析硬实力</p>
        </div>
      </div>
      <div className="space-y-3">
        {metrics.map((metric) => (
          <details key={metric.id} className="group rounded-lg border border-line bg-surface p-3" open={metric.status !== "normal"}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{metric.name}</span>
                <span className="block truncate text-xs text-muted">{metric.formattedValue} · 环比 {metric.changeLabel}</span>
              </span>
              <StatusBadge status={metric.status} />
            </summary>
            <div className="mt-3 border-t border-line pt-3">
              <p className="text-xs leading-5 text-slate-600">{metric.definition}</p>
              <pre className="mt-2 rounded-md bg-slate-950 p-3 text-[11px] leading-5 text-slate-100">{metric.sql}</pre>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

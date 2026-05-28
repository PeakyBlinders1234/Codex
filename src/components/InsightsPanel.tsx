import { Lightbulb, Target } from "lucide-react";
import type { Insight } from "@/types";
import { SeverityBadge } from "./StatusBadge";

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <section className="dashboard-panel rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">异常洞察</h2>
          <p className="mt-1 text-xs text-muted">基于阈值规则和本地 Mock AI 解释生成</p>
        </div>
        <Lightbulb className="h-5 w-5 text-accent" aria-hidden="true" />
      </div>
      <div className="space-y-3">
        {insights.map((insight) => (
          <article key={insight.id} className="rounded-lg border border-line bg-surface p-3">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={insight.severity} />
              <span className="text-xs text-muted">{insight.metricName}</span>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-ink">{insight.title}</h3>
            <p className="mt-2 text-xs leading-5 text-muted">{insight.description}</p>
            <div className="mt-3 grid gap-2 text-xs leading-5 md:grid-cols-2">
              <p className="rounded-md border border-line bg-[rgba(var(--panel-rgb),0.66)] p-2 text-muted">{insight.evidence}</p>
              <p className="rounded-md border border-line bg-[rgba(var(--panel-rgb),0.66)] p-2 text-ink">
                <Target className="mr-1 inline h-3.5 w-3.5 text-accent" aria-hidden="true" />
                {insight.recommendation}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

import { ClipboardList } from "lucide-react";
import type { AnalysisReport } from "@/types";

export function ReportPanel({ report }: { report: AnalysisReport | null }) {
  if (!report) {
    return (
      <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
        <p className="text-sm text-muted">AI 报告生成中...</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-accent" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold text-ink">AI 报告预览</h2>
          <p className="text-xs text-muted">{report.period} · {report.generatedAt}</p>
        </div>
      </div>
      <div className="space-y-4 text-sm">
        <div className="rounded-lg bg-teal-50 p-3 text-slate-700">
          <p className="font-medium text-ink">{report.title}</p>
          <p className="mt-2 text-xs leading-5">{report.executiveSummary}</p>
          <p className="mt-2 text-xs leading-5 text-teal-800">{report.aiNarrative}</p>
        </div>
        <ReportList title="关键发现" items={report.keyFindings} />
        <ReportList title="异常原因" items={report.anomalyReasons} />
        <ReportList title="运营建议" items={report.recommendations} />
        <ReportList title="下一步动作" items={report.nextActions} />
      </div>
    </section>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold text-slate-500">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="rounded-md border border-line bg-surface px-3 py-2 text-xs leading-5 text-slate-700">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

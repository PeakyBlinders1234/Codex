"use client";

import { useState } from "react";
import { Check, Clipboard, ClipboardList } from "lucide-react";
import type { AnalysisReport } from "@/types";

export function ReportPanel({ report }: { report: AnalysisReport | null }) {
  const [copied, setCopied] = useState(false);

  if (!report) {
    return (
      <section className="dashboard-panel rounded-lg p-4">
        <p className="text-sm text-muted">AI 报告生成中...</p>
      </section>
    );
  }

  async function copyCapabilitySummary() {
    if (!report) return;

    const text = `DataOps Copilot 是一个 AI 数据运营能力展示 Demo，围绕 ${report.period} 的业务数据，完成 KPI 计算、异常识别、趋势判断、AI 洞察、行动建议和结构化报告生成。当前报告结论是：${report.executiveSummary} 技术上使用 Next.js、TypeScript、Tailwind、Recharts、Three.js 和 AIProvider 抽象，业务上覆盖经营分析、转化分析、用户反馈分析和运营行动闭环。`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="dashboard-panel rounded-lg p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-accent" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold text-ink">AI 报告预览</h2>
            <p className="text-xs text-muted">{report.period} · {report.generatedAt}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={copyCapabilitySummary}
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-[rgba(var(--panel-rgb),0.68)] px-3 py-2 text-xs text-ink transition hover:border-accent hover:text-accent"
        >
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? "已复制" : "复制能力摘要"}
        </button>
      </div>
      <div className="space-y-4 text-sm">
        <div className="rounded-lg border border-accent bg-[rgba(var(--accent-rgb),0.10)] p-3 text-muted">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-ink">{report.title}</p>
            <span className="rounded-full border border-accent px-2 py-1 text-[11px] font-semibold text-accent">AI generated · mock stable</span>
          </div>
          <p className="mt-2 text-xs leading-5">{report.executiveSummary}</p>
          <p className="mt-2 text-xs leading-5 text-accent">{report.aiNarrative}</p>
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
      <h3 className="mb-2 text-xs font-semibold text-muted">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="rounded-md border border-line bg-surface px-3 py-2 text-xs leading-5 text-muted">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

import { Activity, AlertTriangle, BrainCircuit, Calculator, ClipboardCheck, DatabaseZap, FileText, Moon, SunMedium } from "lucide-react";
import type { CommandCenterAnalysis, Scenario, ThemeMode } from "@/types";

export function DashboardHeader({
  scenario,
  period,
  command,
  theme,
  onThemeChange
}: {
  scenario: Scenario;
  period: string;
  command: CommandCenterAnalysis;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  const ThemeIcon = theme === "dark" ? SunMedium : Moon;

  return (
    <header className="border-b border-line bg-[rgba(var(--panel-rgb),0.78)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-slate-950 shadow-[0_0_28px_rgba(var(--accent-rgb),0.28)]">
              <DatabaseZap className="h-5 w-5" aria-hidden="true" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-[var(--panel)] bg-success" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-accent">AI Ops Console</p>
              <h1 className="text-xl font-semibold tracking-normal text-ink sm:text-2xl">DataOps Copilot</h1>
              <p className="text-sm text-muted">AI 数据运营能力展示 · 异常识别 / 洞察解释 / 报告生成 / 行动建议</p>
            </div>
          </div>
          <p className="max-w-3xl text-xs leading-5 text-muted">
            这个 Demo 展示一条完整 AI 数据运营链路：输入业务数据，自动计算指标和风险，再生成可执行的经营摘要与行动闭环。
          </p>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:min-w-[680px] lg:grid-cols-4">
          <div className="dashboard-chip rounded-lg px-3 py-2">
            <p className="text-xs text-muted">当前场景</p>
            <p className="truncate font-medium text-ink">{scenario.name} · {scenario.shortName}</p>
          </div>
          <div className="dashboard-chip rounded-lg px-3 py-2">
            <p className="text-xs text-muted">数据周期</p>
            <p className="truncate font-medium text-ink">{period}</p>
          </div>
          <div className="dashboard-chip rounded-lg px-3 py-2">
            <p className="flex items-center gap-1 text-xs text-success">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              AI 引擎
            </p>
            <p className="truncate font-medium text-ink">Mock AI · 可接真实模型</p>
          </div>
          <button
            type="button"
            onClick={() => onThemeChange(nextTheme)}
            className="dashboard-chip flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition hover:border-accent hover:text-accent"
            aria-label="切换主题"
          >
            <span>
              <span className="block text-xs text-muted">主题模式</span>
              <span className="block font-medium text-ink">{theme === "dark" ? "深色科技" : "浅色专业"}</span>
            </span>
            <ThemeIcon className="h-4 w-4 text-accent" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-70" />
    </header>
  );
}

export function AIWorkflowStrip({ command }: { command: CommandCenterAnalysis }) {
  const steps = [
    { label: "业务数据", detail: "本地 mock 数据集", icon: DatabaseZap },
    { label: "指标计算", detail: "KPI / 环比 / 成本率", icon: Calculator },
    { label: "异常识别", detail: `${command.riskCount} 个风险信号`, icon: AlertTriangle },
    { label: "AI 洞察", detail: "解释原因和证据", icon: BrainCircuit },
    { label: "报告生成", detail: "结构化经营报告", icon: FileText },
    { label: "行动建议", detail: `${command.openActionCount} 项待推进`, icon: ClipboardCheck }
  ];

  return (
    <section className="dashboard-panel overflow-hidden rounded-lg p-3">
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div key={step.label} className="relative rounded-lg border border-line bg-[rgba(var(--panel-rgb),0.42)] px-3 py-3">
              {index < steps.length - 1 ? (
                <span className="pointer-events-none absolute right-[-10px] top-1/2 z-10 hidden h-px w-5 bg-accent/60 xl:block" />
              ) : null}
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[rgba(var(--accent-rgb),0.14)] text-accent">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{step.label}</span>
                  <span className="block truncate text-xs text-muted">{step.detail}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CommandSummaryStrip({ command }: { command: CommandCenterAnalysis }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCell label="经营健康分" value={`${command.healthScore.score}`} detail={command.healthScore.label} />
      <SummaryCell label="风险队列" value={`${command.riskCount}`} detail="关键异常 / P0 预警" />
      <SummaryCell label="待执行动作" value={`${command.openActionCount}`} detail="需要负责人推进" />
      <SummaryCell label="预测窗口" value="T+3" detail="基于最近趋势外推" />
    </section>
  );
}

function SummaryCell({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="dashboard-panel rounded-lg p-4">
      <p className="text-xs text-muted">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold text-ink">{value}</p>
        <span className="rounded-full border border-line px-2 py-1 text-xs text-accent">{detail}</span>
      </div>
    </article>
  );
}

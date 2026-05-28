"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Gauge, RadioTower, ShieldAlert, Sparkles, Target, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ActionItem, ActionStatus, AlertFilter, AlertItem, CommandCenterAnalysis, ForecastPoint, HealthLevel } from "@/types";

const levelTone: Record<HealthLevel, string> = {
  excellent: "text-success",
  stable: "text-accent",
  watch: "text-warning",
  risk: "text-danger"
};

const priorityClass = {
  P0: "border-rose-400/40 bg-rose-400/10 text-danger",
  P1: "border-amber-400/40 bg-amber-400/10 text-warning",
  P2: "border-teal-400/35 bg-teal-400/10 text-accent"
};

function tooltipFormatter(value: unknown, name: unknown): [string, string] {
  return [typeof value === "number" ? value.toLocaleString("zh-CN") : String(value ?? "-"), String(name ?? "")];
}

export function HealthScorePanel({ command }: { command: CommandCenterAnalysis }) {
  const score = command.healthScore.score;
  const circle = 2 * Math.PI * 44;
  const dash = `${(score / 100) * circle} ${circle}`;

  return (
    <section className="dashboard-panel rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Gauge className="h-4 w-4 text-accent" aria-hidden="true" />
            经营健康分
          </div>
          <p className="mt-2 max-w-sm text-xs leading-5 text-muted">{command.healthScore.summary}</p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-xs ${priorityClass[command.healthScore.level === "risk" ? "P0" : command.healthScore.level === "watch" ? "P1" : "P2"]}`}>
          {command.healthScore.label}
        </span>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[150px_minmax(0,1fr)]">
        <div className="relative mx-auto h-[132px] w-[132px]">
          <svg viewBox="0 0 108 108" className="h-full w-full -rotate-90">
            <circle cx="54" cy="54" r="44" stroke="var(--line)" strokeWidth="10" fill="none" />
            <circle
              cx="54"
              cy="54"
              r="44"
              stroke="var(--accent)"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={dash}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-semibold ${levelTone[command.healthScore.level]}`}>{score}</span>
            <span className="text-xs text-muted">/ 100</span>
          </div>
        </div>
        <div className="grid content-center gap-2">
          {command.healthScore.drivers.map((driver) => (
            <div key={driver} className="dashboard-chip rounded-lg px-3 py-2 text-xs leading-5 text-muted">
              <CheckCircle2 className="mr-2 inline h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {driver}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const actionStatuses: ActionStatus[] = ["待处理", "推进中", "本周验证"];

export function AlertQueuePanel({
  alerts,
  filter = "all",
  onFilterChange,
  onSelectAlert,
  selectedAlertId
}: {
  alerts: AlertItem[];
  filter?: AlertFilter;
  onFilterChange?: (filter: AlertFilter) => void;
  onSelectAlert?: (alert: AlertItem) => void;
  selectedAlertId?: string | null;
}) {
  const filteredAlerts = filter === "all" ? alerts : alerts.filter((alert) => alert.priority === filter);

  return (
    <section className="dashboard-panel rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ShieldAlert className="h-4 w-4 text-danger" aria-hidden="true" />
            预警队列
          </h2>
          <p className="mt-1 text-xs text-muted">按业务影响和异常严重度自动排序</p>
        </div>
        <span className="rounded-full border border-line px-2 py-1 text-xs text-muted">{filteredAlerts.length} 条</span>
      </div>
      {onFilterChange ? (
        <div className="mb-4 grid grid-cols-4 gap-1 rounded-xl border border-line bg-[rgba(var(--panel-rgb),0.45)] p-1">
          {(["all", "P0", "P1", "P2"] as AlertFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onFilterChange(item)}
              className={`rounded-lg px-2 py-1.5 text-xs transition ${filter === item ? "bg-[rgba(var(--accent-rgb),0.18)] text-accent" : "text-muted hover:text-ink"}`}
            >
              {item === "all" ? "全部" : item}
            </button>
          ))}
        </div>
      ) : null}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <button
            key={alert.id}
            type="button"
            onClick={() => onSelectAlert?.(alert)}
            className={`w-full rounded-lg border bg-surface p-3 text-left transition ${
              selectedAlertId === alert.id ? "border-accent bg-[rgba(var(--accent-rgb),0.12)]" : "border-line hover:border-accent"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityClass[alert.priority]}`}>{alert.priority}</span>
              <span className="text-xs text-muted">{alert.metricName}</span>
              <span className="ml-auto text-xs text-muted">{alert.ownerRole}</span>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-ink">{alert.title}</h3>
            <p className="mt-2 text-xs leading-5 text-muted">{alert.reason}</p>
            <p className="mt-2 rounded-md border border-line bg-[rgba(var(--panel-rgb),0.72)] p-2 text-xs leading-5 text-ink">
              <Target className="mr-1 inline h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {alert.recommendation}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

export function ForecastPanel({ forecast }: { forecast: ForecastPoint[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="dashboard-panel rounded-lg p-4">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-accent" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold text-ink">未来 3 天趋势预测</h2>
          <p className="text-xs text-muted">基于最近 4 个时间点的趋势外推</p>
        </div>
      </div>
      <div className="h-[220px] min-w-0">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} tickLine={false} axisLine={false} width={48} />
              <Tooltip formatter={tooltipFormatter} contentStyle={{ borderColor: "var(--line)", borderRadius: 8, background: "var(--panel)", color: "var(--ink)" }} />
              <Line type="monotone" dataKey="optimistic" name="乐观" stroke="var(--accent)" strokeWidth={1.8} dot={false} />
              <Line type="monotone" dataKey="value" name="预测" stroke="var(--cyan)" strokeWidth={2.4} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="conservative" name="保守" stroke="var(--warning)" strokeWidth={1.8} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-line bg-surface text-xs text-muted">
            预测模型加载中...
          </div>
        )}
      </div>
    </section>
  );
}

export function ActionBoard({
  items,
  onStatusChange,
  selectedActionId
}: {
  items: ActionItem[];
  onStatusChange?: (id: string, status: ActionStatus) => void;
  selectedActionId?: string | null;
}) {
  return (
    <section className="dashboard-panel rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <RadioTower className="h-4 w-4 text-accent" aria-hidden="true" />
            行动任务看板
          </h2>
          <p className="mt-1 text-xs text-muted">把洞察转成负责人、优先级和验收影响</p>
        </div>
        <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <article
            key={item.id}
            className={`rounded-lg border bg-surface p-3 transition ${selectedActionId === item.id ? "border-accent bg-[rgba(var(--accent-rgb),0.12)]" : "border-line"}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityClass[item.priority]}`}>{item.priority}</span>
              <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">{item.status}</span>
              <span className="ml-auto text-xs text-muted">{item.due}</span>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-ink">{item.title}</h3>
            <div className="mt-2 grid gap-2 text-xs leading-5 text-muted sm:grid-cols-3">
              <span>负责人：{item.ownerRole}</span>
              <span>关联：{item.relatedMetric}</span>
              <span className="text-accent">影响：{item.impact}</span>
            </div>
            {onStatusChange ? (
              <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-line bg-[rgba(var(--panel-rgb),0.42)] p-1">
                {actionStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onStatusChange(item.id, status)}
                    className={`rounded-lg px-2 py-1.5 text-xs transition ${item.status === status ? "bg-[rgba(var(--accent-rgb),0.18)] text-accent" : "text-muted hover:text-ink"}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function ManagementBrief({ command }: { command: CommandCenterAnalysis }) {
  return (
    <section className="dashboard-panel rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(var(--accent-rgb),0.15)] text-accent">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">AI 经营摘要</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{command.executiveBrief}</p>
        </div>
      </div>
    </section>
  );
}

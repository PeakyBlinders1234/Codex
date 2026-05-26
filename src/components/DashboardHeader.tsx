import { Activity, DatabaseZap } from "lucide-react";
import type { Scenario } from "@/types";

export function DashboardHeader({ scenario }: { scenario: Scenario }) {
  return (
    <header className="border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white">
              <DatabaseZap className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-normal text-ink sm:text-2xl">DataOps Copilot</h1>
              <p className="text-sm text-muted">AI 数据运营分析工作台</p>
            </div>
          </div>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-3 lg:min-w-[560px]">
          <div className="rounded-lg border border-line bg-surface px-3 py-2">
            <p className="text-xs text-muted">当前场景</p>
            <p className="truncate font-medium text-ink">{scenario.name} · {scenario.shortName}</p>
          </div>
          <div className="rounded-lg border border-line bg-surface px-3 py-2">
            <p className="text-xs text-muted">数据源</p>
            <p className="truncate font-medium text-ink">{scenario.tableName}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="flex items-center gap-1 text-xs text-emerald-700">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              演示状态
            </p>
            <p className="font-medium text-emerald-800">本地 Mock AI · 稳定可演示</p>
          </div>
        </div>
      </div>
    </header>
  );
}

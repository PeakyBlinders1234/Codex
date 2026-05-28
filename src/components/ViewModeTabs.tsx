import { BarChart3, BrainCircuit, ClipboardCheck, Search, Sparkles } from "lucide-react";
import type { DashboardViewMode } from "@/types";

const modes: Array<{
  id: DashboardViewMode;
  label: string;
  description: string;
  icon: typeof BrainCircuit;
}> = [
  { id: "command", label: "总控", description: "AI 指挥舱", icon: BrainCircuit },
  { id: "analysis", label: "分析", description: "KPI、图表、SQL", icon: BarChart3 },
  { id: "query", label: "问数", description: "补充询问机制", icon: Search },
  { id: "action", label: "行动", description: "预警和任务闭环", icon: ClipboardCheck },
  { id: "capability", label: "能力", description: "AI 工作流说明", icon: Sparkles }
];

export function ViewModeTabs({
  active,
  onChange
}: {
  active: DashboardViewMode;
  onChange: (mode: DashboardViewMode) => void;
}) {
  return (
    <section className="dashboard-panel rounded-lg p-2">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const selected = mode.id === active;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChange(mode.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                selected ? "bg-[rgba(var(--accent-rgb),0.18)] text-accent" : "text-muted hover:bg-[rgba(var(--panel-rgb),0.55)] hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{mode.label}</span>
                <span className="block truncate text-xs opacity-80">{mode.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

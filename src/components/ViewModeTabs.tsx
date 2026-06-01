import { BarChart3, BrainCircuit, ClipboardCheck, Sparkles } from "lucide-react";
import type { DashboardViewMode } from "@/types";

const modes: Array<{
  id: DashboardViewMode;
  label: string;
  description: string;
  icon: typeof BrainCircuit;
}> = [
  { id: "command", label: "总控", description: "AI 指挥舱", icon: BrainCircuit },
  { id: "analysis", label: "分析", description: "KPI、图表、SQL", icon: BarChart3 },
  { id: "action", label: "行动", description: "预警和任务闭环", icon: ClipboardCheck },
  { id: "capability", label: "能力", description: "AI 工作流说明", icon: Sparkles }
];

export function ViewModeTabs({
  active,
  onChange,
  variant = "sidebar"
}: {
  active: DashboardViewMode;
  onChange: (mode: DashboardViewMode) => void;
  variant?: "sidebar" | "strip" | "rail";
}) {
  if (variant === "rail") {
    return (
      <nav className="rail-tabs" aria-label="工作台视图">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const selected = mode.id === active;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChange(mode.id)}
              className={`rail-tab group ${selected ? "is-active" : ""}`}
              title={`${mode.label}：${mode.description}`}
            >
              <span className="rail-tab-icon">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-semibold">{mode.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className={variant === "strip" ? "dashboard-panel rounded-lg p-2" : "space-y-2"} aria-label="工作台视图">
      <div className={variant === "strip" ? "grid gap-2 sm:grid-cols-2 lg:grid-cols-4" : "grid gap-2"}>
        {modes.map((mode) => {
          const Icon = mode.icon;
          const selected = mode.id === active;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChange(mode.id)}
              className={`group flex items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                selected
                  ? "bg-[rgba(var(--accent-rgb),0.14)] text-accent shadow-[inset_0_0_0_1px_rgba(var(--accent-rgb),0.20)]"
                  : "text-muted hover:bg-[rgba(var(--panel-rgb),0.72)] hover:text-ink"
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition ${selected ? "bg-accent text-white" : "bg-[rgba(var(--panel-rgb),0.72)] text-muted group-hover:text-accent"}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{mode.label}</span>
                <span className="block truncate text-xs opacity-80">{mode.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

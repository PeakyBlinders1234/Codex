import { BarChart3, LineChart, MessageSquareText } from "lucide-react";
import type { Scenario, ScenarioId } from "@/types";

const icons = {
  operations: BarChart3,
  conversion: LineChart,
  feedback: MessageSquareText
};

export function ScenarioSwitcher({
  scenarios,
  activeId,
  onChange,
  variant = "stack"
}: {
  scenarios: Scenario[];
  activeId: ScenarioId;
  onChange: (id: ScenarioId) => void;
  variant?: "stack" | "deck";
}) {
  if (variant === "deck") {
    return (
      <section className="scenario-deck rounded-lg p-2">
        <div className="grid gap-2">
          {scenarios.map((scenario) => {
            const Icon = icons[scenario.id];
            const active = scenario.id === activeId;

            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => onChange(scenario.id)}
                className={`scenario-deck-button group flex min-h-[82px] items-center gap-3 rounded-lg border p-3 text-left transition ${
                  active
                    ? "border-accent bg-[rgba(var(--accent-rgb),0.18)] text-ink"
                    : "border-line bg-[rgba(var(--panel-rgb),0.38)] text-ink hover:border-accent hover:bg-[rgba(var(--accent-rgb),0.10)]"
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-accent text-[#041211]" : "border border-line bg-[rgba(var(--panel-rgb),0.42)] text-muted group-hover:text-accent"}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{scenario.name}</span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted">{scenario.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-line bg-[rgba(var(--panel-rgb),0.46)] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">业务控制台</h2>
          <p className="text-xs text-muted">场景切换会刷新指标和 AI 结果</p>
        </div>
      </div>
      <div className="grid gap-2">
        {scenarios.map((scenario) => {
          const Icon = icons[scenario.id];
          const active = scenario.id === activeId;

          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => onChange(scenario.id)}
              className={`flex min-h-[76px] items-start gap-3 rounded-lg border p-3 text-left transition ${
                active
                  ? "border-accent bg-[rgba(var(--accent-rgb),0.12)] text-ink"
                  : "border-line bg-[rgba(var(--panel-rgb),0.62)] text-ink hover:border-accent hover:bg-[rgba(var(--accent-rgb),0.08)]"
              }`}
            >
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${active ? "bg-accent text-white" : "border border-line bg-[rgba(var(--panel-rgb),0.65)] text-muted"}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{scenario.name}</span>
                <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted">{scenario.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

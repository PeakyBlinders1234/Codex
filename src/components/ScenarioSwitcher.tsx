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
  onChange
}: {
  scenarios: Scenario[];
  activeId: ScenarioId;
  onChange: (id: ScenarioId) => void;
}) {
  return (
    <section className="dashboard-panel rounded-lg p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">业务控制台</h2>
          <p className="text-xs text-muted">切换后驾驶舱全量刷新</p>
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
              className={`flex min-h-[92px] items-start gap-3 rounded-lg border p-3 text-left transition ${
                active
                  ? "border-accent bg-[rgba(var(--accent-rgb),0.12)] text-ink shadow-panel"
                  : "border-line bg-surface text-ink hover:border-accent hover:bg-[rgba(var(--accent-rgb),0.08)]"
              }`}
            >
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${active ? "bg-accent text-slate-950" : "border border-line bg-[rgba(var(--panel-rgb),0.65)] text-muted"}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{scenario.name}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">{scenario.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

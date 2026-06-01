"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { DatabaseZap, Orbit, PanelRightOpen, Search, Sparkles } from "lucide-react";
import { AIWorkflowStrip, DashboardHeader } from "@/components/DashboardHeader";
import { ScenarioSwitcher } from "@/components/ScenarioSwitcher";
import { KpiGrid } from "@/components/KpiGrid";
import { ChartPanels } from "@/components/ChartPanels";
import { InsightsPanel } from "@/components/InsightsPanel";
import { ReportPanel } from "@/components/ReportPanel";
import { MetricDictionary } from "@/components/MetricDictionary";
import { CapabilityMode } from "@/components/CapabilityMode";
import { AskCommandDrawer } from "@/components/AskCommandDrawer";
import { ActionBoard, AlertQueuePanel, ForecastPanel, HealthScorePanel, ManagementBrief } from "@/components/CommandCenterPanels";
import { ViewModeTabs } from "@/components/ViewModeTabs";
import { LiquidGlassLens } from "@/components/LiquidGlassLens";
import { ProximityTelemetry } from "@/components/ProximityTelemetry";
import { scenarios } from "@/data/scenarios";
import { buildScenarioAnalysis } from "@/lib/analytics";
import { buildCommandCenterAnalysis, buildConstellationModel } from "@/lib/command-center";
import { generateAnalysisReport } from "@/lib/report-generator";
import type { ActionStatus, AlertFilter, AnalysisReport, ConstellationNode, DashboardViewMode, Metric, ScenarioId, ThemeMode } from "@/types";

const DepthField = dynamic(() => import("@/components/DepthField").then((module) => module.DepthField), {
  ssr: false,
  loading: () => null
});

const BusinessConstellation = dynamic(() => import("@/components/BusinessConstellation").then((module) => module.BusinessConstellation), {
  ssr: false,
  loading: () => (
    <section className="constellation-shell relative min-h-[560px] overflow-hidden rounded-lg p-5">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Interactive Data Field</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">AI 数据场景</h2>
      <div className="mt-6 h-[420px] rounded-lg border border-line bg-[rgba(var(--panel-rgb),0.42)]" />
    </section>
  )
});

export default function Home() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("operations");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [viewMode, setViewMode] = useState<DashboardViewMode>("command");
  const [isAskDrawerOpen, setIsAskDrawerOpen] = useState(false);
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [alertFilter, setAlertFilter] = useState<AlertFilter>("all");
  const [localActionStatuses, setLocalActionStatuses] = useState<Record<string, ActionStatus>>({});
  const analysis = useMemo(() => buildScenarioAnalysis(scenarioId), [scenarioId]);
  const command = useMemo(() => buildCommandCenterAnalysis(analysis), [analysis]);
  const actionItems = useMemo(
    () => command.actionItems.map((item) => ({ ...item, status: localActionStatuses[item.id] ?? item.status })),
    [command.actionItems, localActionStatuses]
  );
  const effectiveCommand = useMemo(
    () => ({
      ...command,
      actionItems,
      openActionCount: actionItems.filter((item) => item.status !== "本周验证").length
    }),
    [actionItems, command]
  );
  const constellation = useMemo(() => buildConstellationModel(analysis, effectiveCommand), [analysis, effectiveCommand]);
  const selectedMetric = analysis.metrics.find((metric) => metric.id === selectedMetricId) ?? analysis.metrics[0] ?? null;
  const activeNodeId = selectedNodeId ?? constellation.selectedNodeId;
  const selectedAlertId = activeNodeId?.startsWith("alert-") ? activeNodeId : null;
  const selectedActionId = actionItems.some((item) => item.id === activeNodeId) ? activeNodeId : null;

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("dataops-theme-v4");
    const nextTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  function handleThemeChange(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("dataops-theme-v4", nextTheme);
  }

  useEffect(() => {
    setSelectedMetricId(analysis.metrics[0]?.id ?? null);
    setSelectedNodeId(`scenario-${analysis.scenario.id}`);
    setAlertFilter("all");
  }, [analysis.metrics, analysis.scenario.id]);

  useEffect(() => {
    let active = true;
    setReport(null);

    generateAnalysisReport(analysis).then((nextReport) => {
      if (active) setReport(nextReport);
    });

    return () => {
      active = false;
    };
  }, [analysis]);

  function handleMetricSelect(metric: Metric) {
    setSelectedMetricId(metric.id);
    setSelectedNodeId(`metric-${metric.id}`);
  }

  function handleNodeSelect(node: ConstellationNode) {
    setSelectedNodeId(node.id);
    if (node.linkedMetricId) setSelectedMetricId(node.linkedMetricId);
    if (node.type === "alert" && node.priority) setAlertFilter(node.priority);
    if (node.type === "action") setViewMode("action");
  }

  function handleActionStatusChange(id: string, status: ActionStatus) {
    setLocalActionStatuses((current) => ({ ...current, [id]: status }));
    setSelectedNodeId(id);
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-80">
        <DepthField className="!pointer-events-none" />
      </div>
      <div className="studio-shell relative z-10">
        <aside className="studio-sidebar">
          <section className="sidebar-brand rounded-lg p-3">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-white shadow-[0_18px_34px_rgba(var(--accent-rgb),0.28)]">
                <DatabaseZap className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-[var(--panel)] bg-[var(--lime)]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">DataOps</p>
                <h1 className="text-sm font-semibold leading-tight text-ink">Copilot</h1>
              </div>
            </div>
          </section>
          <ViewModeTabs active={viewMode} onChange={setViewMode} variant="rail" />
          <button
            type="button"
            onClick={() => setIsAskDrawerOpen(true)}
            className="rail-ask-button mt-auto inline-flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-lg border border-accent/40 bg-[rgba(var(--accent-rgb),0.16)] px-2 py-3 text-xs font-semibold text-accent transition hover:bg-[rgba(var(--accent-rgb),0.24)]"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            问数
          </button>
        </aside>

        <section className="studio-main">
          <DashboardHeader scenario={analysis.scenario} period={analysis.period} command={effectiveCommand} theme={theme} onThemeChange={handleThemeChange} />
          <div className="mx-auto max-w-[1540px] space-y-4 px-4 py-4 sm:px-6 lg:px-8">
            <CommandExperienceDeck
              scenarioId={scenarioId}
              onScenarioChange={setScenarioId}
              healthScore={effectiveCommand.healthScore.score}
              riskCount={effectiveCommand.riskCount}
              actionCount={effectiveCommand.openActionCount}
              onOpenAsk={() => setIsAskDrawerOpen(true)}
            />
            {viewMode === "command" ? (
              <section className="view-transition space-y-4">
                <div className="bento-grid">
                  <div className="min-w-0 space-y-4">
                    <HealthScorePanel command={effectiveCommand} />
                    <AIWorkflowStrip command={effectiveCommand} />
                  </div>
                  <div className="min-w-0">
                    <BusinessConstellation
                      model={constellation}
                      selectedNodeId={activeNodeId}
                      selectedMetricId={selectedMetric?.id ?? null}
                      onSelectNode={handleNodeSelect}
                    />
                  </div>
                  <aside className="min-w-0 space-y-4">
                    <ManagementBrief command={effectiveCommand} />
                    <AlertQueuePanel
                      alerts={effectiveCommand.alertQueue}
                      filter={alertFilter}
                      onFilterChange={setAlertFilter}
                      selectedAlertId={selectedAlertId}
                      onSelectAlert={(alert) => {
                        setSelectedNodeId(alert.id);
                        setAlertFilter(alert.priority);
                      }}
                    />
                  </aside>
                </div>
                <KpiGrid metrics={analysis.metrics} limit={4} compact selectedMetricId={selectedMetric?.id ?? null} onSelectMetric={handleMetricSelect} />
                <div className="grid gap-4 xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
                  <ForecastPanel forecast={effectiveCommand.forecast} />
                  <ActionBoard items={actionItems} selectedActionId={selectedActionId} onStatusChange={handleActionStatusChange} />
                </div>
              </section>
            ) : null}

            {viewMode === "analysis" ? (
              <section className="view-transition space-y-4">
                <KpiGrid metrics={analysis.metrics} selectedMetricId={selectedMetric?.id ?? null} onSelectMetric={handleMetricSelect} />
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="space-y-4">
                    <ChartPanels charts={analysis.charts} selectedMetricName={selectedMetric?.name ?? null} />
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                      <InsightsPanel insights={analysis.insights} />
                      <ReportPanel report={report} />
                    </div>
                  </div>
                  <MetricDictionary metrics={analysis.metrics} selectedMetricId={selectedMetric?.id ?? null} />
                </div>
              </section>
            ) : null}

            {viewMode === "action" ? (
              <section className="view-transition grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <AlertQueuePanel
                  alerts={effectiveCommand.alertQueue}
                  filter={alertFilter}
                  onFilterChange={setAlertFilter}
                  selectedAlertId={selectedAlertId}
                  onSelectAlert={(alert) => {
                    setSelectedNodeId(alert.id);
                    setAlertFilter(alert.priority);
                  }}
                />
                <ActionBoard items={actionItems} selectedActionId={selectedActionId} onStatusChange={handleActionStatusChange} />
              </section>
            ) : null}

            {viewMode === "capability" ? (
              <section className="view-transition grid gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
                <div className="space-y-4">
                  <CapabilityMode />
                  <MetricDictionary metrics={analysis.metrics} selectedMetricId={selectedMetric?.id ?? null} />
                </div>
                <ReportPanel report={report} />
              </section>
            ) : null}
          </div>
        </section>
      </div>
      <AskCommandDrawer open={isAskDrawerOpen} onClose={() => setIsAskDrawerOpen(false)} />
    </main>
  );
}

function CommandExperienceDeck({
  scenarioId,
  onScenarioChange,
  healthScore,
  riskCount,
  actionCount,
  onOpenAsk
}: {
  scenarioId: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
  healthScore: number;
  riskCount: number;
  actionCount: number;
  onOpenAsk: () => void;
}) {
  return (
    <section className="command-stage rounded-lg p-4 sm:p-5">
      <div className="glass-field-lines" aria-hidden="true" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <div className="relative z-10 min-w-0">
          <LiquidGlassLens className="mb-4 inline-flex" prominent>
            <div className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              <Orbit className="h-3.5 w-3.5" aria-hidden="true" />
              Liquid AI Operations Layer
            </div>
          </LiquidGlassLens>
          <h2 className="max-w-3xl text-balance text-3xl font-semibold leading-tight text-ink sm:text-5xl">
            用 AI 把业务数据变成可执行的运营指挥链路
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            异常识别、原因解释、结构化报告、行动任务和自然语言问数被放在同一个可演示系统里，打开页面就能看到完整闭环。
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StageSignal label="健康分" value={String(healthScore)} suffix="/100" />
            <StageSignal label="风险信号" value={String(riskCount)} suffix="个" />
            <StageSignal label="待推进动作" value={String(actionCount)} suffix="项" />
          </div>
          <div className="mt-4">
            <ProximityTelemetry />
          </div>
        </div>
        <div className="relative z-10 grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
          <ScenarioSwitcher scenarios={scenarios} activeId={scenarioId} onChange={onScenarioChange} variant="deck" />
          <QuickAskCard onOpen={onOpenAsk} />
        </div>
      </div>
    </section>
  );
}

function StageSignal({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <div className="stage-signal rounded-lg px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 flex items-end gap-1 text-3xl font-semibold text-ink">
        {value}
        <span className="pb-1 text-xs font-medium text-muted">{suffix}</span>
      </p>
    </div>
  );
}

function QuickAskCard({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="ai-ask-card rounded-lg p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="liquid-control flex h-9 w-9 items-center justify-center rounded-md text-accent">
          <Search className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">AI Ask Bar</h2>
          <p className="text-xs text-muted">Slot Filling 问数演示</p>
        </div>
      </div>
      <div className="rounded-lg border border-line bg-[rgba(var(--panel-rgb),0.62)] p-3 text-xs leading-5 text-muted">
        <p className="font-medium text-ink">我要查潍坊工程上周单量</p>
        <p className="mt-1">缺少校区 ID 和明确时间范围时，先补充询问，再返回看板和 Excel 表格。</p>
      </div>
      <button type="button" onClick={onOpen} className="mt-3 inline-flex min-h-11 w-full items-center justify-between rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-[#041211] transition hover:bg-[var(--accent-strong)]">
        <span className="inline-flex items-center gap-2">
          <PanelRightOpen className="h-4 w-4" aria-hidden="true" />
          打开独立问数<span className="sr-only">抽屉</span>
        </span>
        <Sparkles className="h-4 w-4" aria-hidden="true" />
      </button>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, DatabaseZap, Search } from "lucide-react";
import { BusinessConstellation } from "@/components/BusinessConstellation";
import { DepthField } from "@/components/DepthField";
import { AIWorkflowStrip, DashboardHeader } from "@/components/DashboardHeader";
import { ScenarioSwitcher } from "@/components/ScenarioSwitcher";
import { KpiGrid } from "@/components/KpiGrid";
import { ChartPanels } from "@/components/ChartPanels";
import { InsightsPanel } from "@/components/InsightsPanel";
import { ReportPanel } from "@/components/ReportPanel";
import { MetricDictionary } from "@/components/MetricDictionary";
import { CapabilityMode } from "@/components/CapabilityMode";
import { NaturalLanguageQueryDemo } from "@/components/NaturalLanguageQueryDemo";
import { ActionBoard, AlertQueuePanel, ForecastPanel, HealthScorePanel, ManagementBrief } from "@/components/CommandCenterPanels";
import { ViewModeTabs } from "@/components/ViewModeTabs";
import { scenarios } from "@/data/scenarios";
import { buildScenarioAnalysis } from "@/lib/analytics";
import { buildCommandCenterAnalysis, buildConstellationModel } from "@/lib/command-center";
import { generateAnalysisReport } from "@/lib/report-generator";
import type { ActionStatus, AlertFilter, AnalysisReport, ConstellationNode, DashboardViewMode, Metric, ScenarioId, ThemeMode } from "@/types";

export default function Home() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("operations");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [viewMode, setViewMode] = useState<DashboardViewMode>("command");
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
    const savedTheme = window.localStorage.getItem("dataops-theme-v2");
    const nextTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  function handleThemeChange(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("dataops-theme-v2", nextTheme);
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
      <div className="pointer-events-none fixed right-0 top-0 z-0 hidden h-[420px] w-[72vw] opacity-50 lg:block">
        <DepthField className="!pointer-events-none" />
      </div>
      <div className="studio-shell relative z-10">
        <aside className="studio-sidebar">
          <section className="sidebar-brand rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-white">
                <DatabaseZap className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-[var(--panel)] bg-[var(--lime)]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">DataOps</p>
                <h1 className="truncate text-lg font-semibold text-ink">Copilot Studio</h1>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">AI 问数、异常解释、报告生成和行动闭环的作品演示。</p>
          </section>
          <ViewModeTabs active={viewMode} onChange={setViewMode} />
          <ScenarioSwitcher scenarios={scenarios} activeId={scenarioId} onChange={setScenarioId} />
          <QuickAskCard onOpen={() => setViewMode("query")} />
        </aside>

        <section className="studio-main">
          <DashboardHeader scenario={analysis.scenario} period={analysis.period} command={effectiveCommand} theme={theme} onThemeChange={handleThemeChange} />
          <div className="mx-auto max-w-[1540px] space-y-4 px-4 py-4 sm:px-6 lg:px-8">
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

            {viewMode === "query" ? (
              <section className="view-transition">
                <NaturalLanguageQueryDemo />
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
    </main>
  );
}

function QuickAskCard({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="ai-ask-card rounded-lg p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/60 text-accent">
          <Search className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-ink">AI Ask Bar</h2>
          <p className="text-xs text-muted">Slot Filling 问数演示</p>
        </div>
      </div>
      <div className="rounded-lg border border-line bg-[rgba(var(--panel-rgb),0.62)] p-3 text-xs leading-5 text-muted">
        <p className="font-medium text-ink">我要查潍坊工程上周单量</p>
        <p className="mt-1">缺少校区 ID 和明确时间范围时，先补充询问，再返回看板和 Excel 表格。</p>
      </div>
      <button type="button" onClick={onOpen} className="mt-3 inline-flex w-full items-center justify-between rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]">
        打开问数演示
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </section>
  );
}

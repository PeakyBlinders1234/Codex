"use client";

import { useEffect, useMemo, useState } from "react";
import { BusinessConstellation } from "@/components/BusinessConstellation";
import { AIWorkflowStrip, CommandSummaryStrip, DashboardHeader } from "@/components/DashboardHeader";
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
  const [theme, setTheme] = useState<ThemeMode>("dark");
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
    const savedTheme = window.localStorage.getItem("dataops-theme");
    const nextTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  function handleThemeChange(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("dataops-theme", nextTheme);
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
    <main className="min-h-screen overflow-hidden">
      <DashboardHeader scenario={analysis.scenario} period={analysis.period} command={effectiveCommand} theme={theme} onThemeChange={handleThemeChange} />
      <div className="mx-auto max-w-[1500px] space-y-4 px-4 py-4 sm:px-6 lg:px-8">
        <AIWorkflowStrip command={effectiveCommand} />

        <section className="grid min-w-0 gap-4 xl:grid-cols-[270px_minmax(0,1fr)_360px]">
          <aside className="min-w-0 space-y-4">
          <ScenarioSwitcher scenarios={scenarios} activeId={scenarioId} onChange={setScenarioId} />
          <HealthScorePanel command={effectiveCommand} />
        </aside>

          <div className="min-w-0 space-y-4">
            <BusinessConstellation
              model={constellation}
              selectedNodeId={activeNodeId}
              selectedMetricId={selectedMetric?.id ?? null}
              onSelectNode={handleNodeSelect}
            />
            <KpiGrid metrics={analysis.metrics} limit={4} compact selectedMetricId={selectedMetric?.id ?? null} onSelectMetric={handleMetricSelect} />
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
        </section>

        <ViewModeTabs active={viewMode} onChange={setViewMode} />

        {viewMode === "command" ? (
          <section className="space-y-4">
            <CommandSummaryStrip command={effectiveCommand} />
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <ForecastPanel forecast={effectiveCommand.forecast} />
              <ActionBoard items={actionItems} selectedActionId={selectedActionId} onStatusChange={handleActionStatusChange} />
            </div>
          </section>
        ) : null}

        {viewMode === "analysis" ? (
          <section className="space-y-4">
            <KpiGrid metrics={analysis.metrics} selectedMetricId={selectedMetric?.id ?? null} onSelectMetric={handleMetricSelect} />
            <ChartPanels charts={analysis.charts} selectedMetricName={selectedMetric?.name ?? null} />
            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <InsightsPanel insights={analysis.insights} />
              <ReportPanel report={report} />
            </div>
            <MetricDictionary metrics={analysis.metrics} selectedMetricId={selectedMetric?.id ?? null} />
          </section>
        ) : null}

        {viewMode === "query" ? <NaturalLanguageQueryDemo /> : null}

        {viewMode === "action" ? (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
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
          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <div className="space-y-4">
              <CapabilityMode />
              <MetricDictionary metrics={analysis.metrics} selectedMetricId={selectedMetric?.id ?? null} />
            </div>
            <ReportPanel report={report} />
          </section>
        ) : null}
      </div>
    </main>
  );
}

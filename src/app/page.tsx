"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ScenarioSwitcher } from "@/components/ScenarioSwitcher";
import { KpiGrid } from "@/components/KpiGrid";
import { ChartPanels } from "@/components/ChartPanels";
import { InsightsPanel } from "@/components/InsightsPanel";
import { ReportPanel } from "@/components/ReportPanel";
import { MetricDictionary } from "@/components/MetricDictionary";
import { InterviewMode } from "@/components/InterviewMode";
import { scenarios } from "@/data/scenarios";
import { buildScenarioAnalysis } from "@/lib/analytics";
import { generateAnalysisReport } from "@/lib/report-generator";
import type { AnalysisReport, ScenarioId } from "@/types";

export default function Home() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("operations");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const analysis = useMemo(() => buildScenarioAnalysis(scenarioId), [scenarioId]);

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

  return (
    <main className="min-h-screen">
      <DashboardHeader scenario={analysis.scenario} />
      <div className="mx-auto grid max-w-[1440px] gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="min-w-0 space-y-4">
          <ScenarioSwitcher scenarios={scenarios} activeId={scenarioId} onChange={setScenarioId} />
          <KpiGrid metrics={analysis.metrics} />
          <ChartPanels charts={analysis.charts} />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <InsightsPanel insights={analysis.insights} />
            <ReportPanel report={report} />
          </div>
        </div>
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          <MetricDictionary metrics={analysis.metrics} />
          <InterviewMode />
        </aside>
      </div>
    </main>
  );
}

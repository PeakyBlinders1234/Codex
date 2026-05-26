export type ScenarioId = "operations" | "conversion" | "feedback";

export type MetricStatus = "normal" | "watch" | "risk";

export type InsightSeverity = "info" | "warning" | "critical";

export type ChartKind = "line" | "bar" | "funnel" | "ranking";

export interface Scenario {
  id: ScenarioId;
  name: string;
  shortName: string;
  description: string;
  audience: string;
  tableName: string;
}

export interface Metric {
  id: string;
  name: string;
  value: number;
  formattedValue: string;
  unit: string;
  changeRate: number;
  changeLabel: string;
  status: MetricStatus;
  definition: string;
  sql: string;
  goodDirection: "up" | "down";
}

export interface ChartKey {
  key: string;
  name: string;
  color: string;
  unit?: string;
}

export interface ChartSeries {
  id: string;
  title: string;
  description: string;
  kind: ChartKind;
  xKey: string;
  yKeys: ChartKey[];
  data: Array<Record<string, string | number>>;
}

export interface Insight {
  id: string;
  scenarioId: ScenarioId;
  title: string;
  severity: InsightSeverity;
  metricName: string;
  description: string;
  evidence: string;
  recommendation: string;
  tags: string[];
}

export interface AnalysisReport {
  scenarioId: ScenarioId;
  title: string;
  period: string;
  executiveSummary: string;
  keyFindings: string[];
  anomalyReasons: string[];
  recommendations: string[];
  nextActions: string[];
  generatedAt: string;
  aiNarrative: string;
}

export interface ScenarioAnalysis {
  scenario: Scenario;
  period: string;
  metrics: Metric[];
  charts: ChartSeries[];
  insights: Insight[];
}

export interface AIProvider {
  name: string;
  generateInsightSummary(input: ScenarioAnalysis): Promise<string>;
  generateReportAdvice(input: ScenarioAnalysis): Promise<string[]>;
}

export interface OperationRow {
  date: string;
  campus: string;
  orders: number;
  revenue: number;
  fulfillmentRate: number;
  timeoutRate: number;
  riderCost: number;
  commissionRevenue: number;
  complaints: number;
  penetrationRate: number;
}

export interface ConversionRow {
  date: string;
  channel: string;
  exposures: number;
  leads: number;
  registrations: number;
  trials: number;
  deals: number;
  dealAmount: number;
  spend: number;
}

export interface FeedbackRow {
  date: string;
  source: string;
  issueType: string;
  sentiment: "正向" | "中性" | "负向";
  count: number;
  averageProcessHours: number;
  averageSatisfaction: number;
  resolvedCount: number;
}

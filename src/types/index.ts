export type ScenarioId = "operations" | "conversion" | "feedback";

export type MetricStatus = "normal" | "watch" | "risk";

export type InsightSeverity = "info" | "warning" | "critical";

export type ChartKind = "line" | "bar" | "funnel" | "ranking";

export type ThemeMode = "dark" | "light";

export type HealthLevel = "excellent" | "stable" | "watch" | "risk";

export type AlertPriority = "P0" | "P1" | "P2";

export type ActionStatus = "待处理" | "推进中" | "本周验证";

export type DashboardViewMode = "command" | "analysis" | "query" | "action" | "capability";

export type AlertFilter = AlertPriority | "all";

export type ConstellationNodeType = "scenario" | "metric" | "alert" | "action";

export type ConstellationNodeStatus = MetricStatus | ActionStatus | HealthLevel | "active";

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

export interface HealthScore {
  score: number;
  level: HealthLevel;
  label: string;
  summary: string;
  drivers: string[];
}

export interface AlertItem {
  id: string;
  priority: AlertPriority;
  severity: InsightSeverity;
  title: string;
  metricName: string;
  reason: string;
  recommendation: string;
  ownerRole: string;
}

export interface ForecastPoint {
  label: string;
  date: string;
  value: number;
  optimistic: number;
  conservative: number;
  unit: string;
}

export interface ActionItem {
  id: string;
  title: string;
  ownerRole: string;
  priority: AlertPriority;
  status: ActionStatus;
  relatedMetric: string;
  due: string;
  impact: string;
}

export interface CommandCenterAnalysis {
  healthScore: HealthScore;
  alertQueue: AlertItem[];
  forecast: ForecastPoint[];
  actionItems: ActionItem[];
  executiveBrief: string;
  riskCount: number;
  openActionCount: number;
}

export interface ConstellationNode {
  id: string;
  label: string;
  type: ConstellationNodeType;
  status?: ConstellationNodeStatus;
  priority?: AlertPriority;
  value?: string;
  description: string;
  linkedMetricId?: string;
}

export interface ConstellationLink {
  source: string;
  target: string;
  strength: number;
}

export interface ConstellationModel {
  nodes: ConstellationNode[];
  links: ConstellationLink[];
  selectedNodeId: string | null;
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

export interface CampusDirectoryItem {
  campusId: string;
  campusName: string;
  aliases: string[];
}

export interface OrderQueryRow {
  date: string;
  campusId: string;
  campusName: string;
  orderCount: number;
  previousWeekOrderCount: number;
  peakHour: string;
}

export type QuerySlotName = "campusId" | "dateRange" | "metric";

export interface SlotExtraction {
  campusName?: string;
  campusId?: string;
  startDate?: string;
  endDate?: string;
  metric?: "单量";
  relativeTime?: string;
  missingSlots: QuerySlotName[];
  status: "needs_clarification" | "ready";
  clarification: string;
}

export interface OrderQueryResult {
  campusId: string;
  campusName: string;
  startDate: string;
  endDate: string;
  totalOrders: number;
  previousTotalOrders: number;
  changeRate: number;
  averageDailyOrders: number;
  peakDate: string;
  peakDateOrders: number;
  rows: OrderQueryRow[];
}

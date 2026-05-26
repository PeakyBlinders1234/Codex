import type { AnalysisReport, ScenarioAnalysis } from "@/types";
import { mockAIProvider } from "./ai-provider";
import { statusLabel } from "./format";

function topMetricSummary(analysis: ScenarioAnalysis) {
  return analysis.metrics
    .slice(0, 3)
    .map((metric) => `${metric.name} ${metric.formattedValue}（${statusLabel(metric.status)}，环比 ${metric.changeLabel}）`);
}

function anomalyReasons(analysis: ScenarioAnalysis) {
  const riskMetrics = analysis.metrics.filter((metric) => metric.status !== "normal");
  if (riskMetrics.length === 0) {
    return ["核心指标未触发风险阈值，当前重点是维持增长效率并持续监控维度结构。"];
  }

  return riskMetrics.map((metric) => `${metric.name}触发${statusLabel(metric.status)}：${metric.definition}`);
}

function nextActions(analysis: ScenarioAnalysis) {
  if (analysis.scenario.id === "operations") {
    return ["按校区拆解高峰时段履约", "复盘骑手补贴与订单密度", "跟踪客诉工单闭环率"];
  }

  if (analysis.scenario.id === "conversion") {
    return ["重排渠道预算", "定位漏斗损耗最大环节", "设计低转化渠道 AB 实验"];
  }

  return ["建立高频问题需求池", "设置处理时长升级线", "用满意度验证产品优化结果"];
}

export async function generateAnalysisReport(analysis: ScenarioAnalysis): Promise<AnalysisReport> {
  const [aiNarrative, aiAdvice] = await Promise.all([
    mockAIProvider.generateInsightSummary(analysis),
    mockAIProvider.generateReportAdvice(analysis)
  ]);

  const insightSummary = analysis.insights[0]?.description ?? "本周期未发现严重异常，建议继续观察核心指标结构变化。";

  return {
    scenarioId: analysis.scenario.id,
    title: `${analysis.scenario.name}结构化分析报告`,
    period: analysis.period,
    executiveSummary: `${analysis.scenario.shortName}场景在 ${analysis.period} 的核心结论：${insightSummary}`,
    keyFindings: topMetricSummary(analysis),
    anomalyReasons: anomalyReasons(analysis),
    recommendations: aiAdvice,
    nextActions: nextActions(analysis),
    generatedAt: "本地 Mock AI 稳定生成",
    aiNarrative
  };
}

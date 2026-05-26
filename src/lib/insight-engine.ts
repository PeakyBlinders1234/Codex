import type { Insight, Metric, ScenarioAnalysis } from "@/types";

const severityByStatus: Record<Metric["status"], Insight["severity"]> = {
  normal: "info",
  watch: "warning",
  risk: "critical"
};

function metricById(analysis: ScenarioAnalysis, id: string) {
  return analysis.metrics.find((metric) => metric.id === id);
}

function createMetricInsight(analysis: ScenarioAnalysis, metric: Metric, index: number): Insight {
  const directionText =
    metric.goodDirection === "up"
      ? metric.changeRate < 0
        ? "下滑"
        : "提升"
      : metric.changeRate > 0
        ? "上升"
        : "下降";

  return {
    id: `${analysis.scenario.id}-${metric.id}-${index}`,
    scenarioId: analysis.scenario.id,
    title: `${metric.name}进入${metric.status === "risk" ? "风险" : "关注"}区间`,
    severity: severityByStatus[metric.status],
    metricName: metric.name,
    description: `${metric.name}当前为 ${metric.formattedValue}，环比${directionText} ${metric.changeLabel}。`,
    evidence: `指标口径：${metric.definition}`,
    recommendation:
      metric.goodDirection === "up"
        ? "拆解到渠道、区域或问题类型，优先定位导致指标走低的维度，并在下个周期复盘改善幅度。"
        : "拆解成本、投诉、时长等构成项，优先处理高占比且可快速干预的环节。",
    tags: ["规则识别", "指标异常"]
  };
}

function scenarioInsights(analysis: ScenarioAnalysis): Insight[] {
  if (analysis.scenario.id === "operations") {
    const campusChart = analysis.charts.find((chart) => chart.id === "ops-campus");
    const riskCampus = [...(campusChart?.data ?? [])].sort(
      (a, b) => Number(b.costRate) + Number(b.complaintRate) * 8 - (Number(a.costRate) + Number(a.complaintRate) * 8)
    )[0];
    const costRate = metricById(analysis, "costRate");
    const complaintRate = metricById(analysis, "complaintRate");

    return [
      {
        id: "operations-campus-risk",
        scenarioId: "operations",
        title: `${riskCampus?.campus ?? "重点校区"}存在履约成本和体验双重压力`,
        severity: costRate?.status === "risk" || complaintRate?.status === "risk" ? "critical" : "warning",
        metricName: "成本率 / 客诉率",
        description: `${riskCampus?.campus ?? "重点校区"}成本率 ${riskCampus?.costRate ?? "-"}%，客诉率 ${riskCampus?.complaintRate ?? "-"}%，需要优先排查骑手供给和高峰时段派单策略。`,
        evidence: "规则：成本率超过 33% 或客诉率超过 1.2% 标记为关注，超过更高阈值标记为风险。",
        recommendation: "将该校区拆到午晚高峰、雨天和宿舍楼栋维度，短期补充高峰骑手激励，长期调整配送半径和商家备餐 SLA。",
        tags: ["区域异常", "履约优化"]
      }
    ];
  }

  if (analysis.scenario.id === "conversion") {
    const channelChart = analysis.charts.find((chart) => chart.id === "conversion-channel");
    const weakChannel = [...(channelChart?.data ?? [])].sort(
      (a, b) => Number(a.dealRate) - Number(b.dealRate)
    )[0];

    return [
      {
        id: "conversion-channel-risk",
        scenarioId: "conversion",
        title: `${weakChannel?.channel ?? "低效渠道"}成交效率低于均值`,
        severity: "warning",
        metricName: "成交转化率",
        description: `${weakChannel?.channel ?? "低效渠道"}当前成交转化率 ${weakChannel?.dealRate ?? "-"}%，CAC ${weakChannel?.cac ?? "-"} 元，需要判断是人群质量、素材承诺还是落地页承接问题。`,
        evidence: "规则：渠道成交转化率低于整体均值或 CAC 高于 24 元时进入优化池。",
        recommendation: "保留高意向关键词和高转化素材，暂停低意图投放组，把预算迁移到社群转介绍和高互动内容渠道。",
        tags: ["渠道优化", "转化漏斗"]
      }
    ];
  }

  const issueChart = analysis.charts.find((chart) => chart.id === "feedback-issue");
  const topIssue = issueChart?.data[0];

  return [
    {
      id: "feedback-product-priority",
      scenarioId: "feedback",
      title: `${topIssue?.issueType ?? "高频问题"}应进入产品优化优先级`,
      severity: "critical",
      metricName: "高频问题类型",
      description: `${topIssue?.issueType ?? "高频问题"}反馈量达到 ${topIssue?.count ?? "-"} 条，且负向反馈与处理时长同步上升。`,
      evidence: "规则：高频问题反馈量持续上升，并带动满意度下降时，标记为 P0/P1 需求候选。",
      recommendation: "建立问题复盘单，拆分为规则说明、前端提示、异常补偿和客服话术四类动作，并在下周观察负向反馈占比是否下降。",
      tags: ["需求优先级", "用户体验"]
    }
  ];
}

export const InsightEngine = {
  generate(analysis: ScenarioAnalysis): Insight[] {
    const metricInsights = analysis.metrics
      .filter((metric) => metric.status !== "normal")
      .map((metric, index) => createMetricInsight(analysis, metric, index));

    const bigDrops = analysis.metrics
      .filter((metric) => metric.goodDirection === "up" && metric.changeRate < -0.1)
      .map((metric, index) => ({
        id: `${analysis.scenario.id}-${metric.id}-drop-${index}`,
        scenarioId: analysis.scenario.id,
        title: `${metric.name}环比下降超过 10%`,
        severity: "critical" as const,
        metricName: metric.name,
        description: `${metric.name}环比 ${metric.changeLabel}，超过预设异常阈值。`,
        evidence: "规则：核心正向指标环比下降超过 10% 自动触发异常提醒。",
        recommendation: "优先对比当前周期和上一周期的维度结构，找出贡献下降最大的区域、渠道或问题类型。",
        tags: ["环比异常", "自动规则"]
      }));

    return [...scenarioInsights(analysis), ...metricInsights, ...bigDrops].slice(0, 5);
  }
};

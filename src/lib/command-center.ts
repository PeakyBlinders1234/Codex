import type {
  ActionItem,
  AlertItem,
  AlertPriority,
  CommandCenterAnalysis,
  ConstellationLink,
  ConstellationModel,
  ConstellationNode,
  ForecastPoint,
  HealthLevel,
  Metric,
  ScenarioAnalysis,
  ScenarioId
} from "@/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function healthLevel(score: number): { level: HealthLevel; label: string } {
  if (score >= 88) return { level: "excellent", label: "高效增长" };
  if (score >= 76) return { level: "stable", label: "经营稳定" };
  if (score >= 62) return { level: "watch", label: "需要关注" };
  return { level: "risk", label: "高风险" };
}

function metricPenalty(metric: Metric) {
  const statusPenalty = {
    normal: 0,
    watch: 6,
    risk: 13
  }[metric.status];
  const businessPositive = metric.goodDirection === "up" ? metric.changeRate >= 0 : metric.changeRate <= 0;
  const changePenalty = businessPositive ? 0 : clamp(Math.abs(metric.changeRate) * 28, 1, 8);

  return statusPenalty + changePenalty;
}

function ownerByScenario(scenarioId: ScenarioId) {
  return {
    operations: "区域运营负责人",
    conversion: "增长运营负责人",
    feedback: "产品运营负责人"
  }[scenarioId];
}

function priorityFromSeverity(severity: AlertItem["severity"], index: number): AlertPriority {
  if (severity === "critical") return "P0";
  if (severity === "warning" || index < 2) return "P1";
  return "P2";
}

function buildHealthScore(analysis: ScenarioAnalysis) {
  const penalty = analysis.metrics.reduce((total, metric) => total + metricPenalty(metric), 0);
  const insightPenalty = analysis.insights.reduce((total, insight) => {
    if (insight.severity === "critical") return total + 8;
    if (insight.severity === "warning") return total + 4;
    return total + 1;
  }, 0);
  const score = clamp(Math.round(96 - penalty - insightPenalty), 42, 96);
  const level = healthLevel(score);
  const riskMetrics = analysis.metrics.filter((metric) => metric.status !== "normal");
  const drivers = riskMetrics.length
    ? riskMetrics.slice(0, 3).map((metric) => `${metric.name} ${metric.formattedValue}，环比 ${metric.changeLabel}`)
    : analysis.metrics.slice(0, 3).map((metric) => `${metric.name}保持${metric.status === "normal" ? "正常" : "可控"}`);

  return {
    score,
    level: level.level,
    label: level.label,
    summary:
      score >= 76
        ? `${analysis.scenario.shortName}整体处于可控区间，建议保持节奏并监控结构性风险。`
        : `${analysis.scenario.shortName}已出现多项预警，需要把分析结果转成明确行动项。`,
    drivers
  };
}

function buildAlerts(analysis: ScenarioAnalysis): AlertItem[] {
  const ownerRole = ownerByScenario(analysis.scenario.id);

  return analysis.insights.map((insight, index) => ({
    id: `alert-${insight.id}`,
    priority: priorityFromSeverity(insight.severity, index),
    severity: insight.severity,
    title: insight.title,
    metricName: insight.metricName,
    reason: insight.description,
    recommendation: insight.recommendation,
    ownerRole
  }));
}

function nextDateLabel(date: string, offset: number) {
  const [month, day] = date.split("-").map(Number);
  if (!month || !day) return `T+${offset}`;
  const next = new Date(2026, month - 1, day + offset);
  const mm = String(next.getMonth() + 1).padStart(2, "0");
  const dd = String(next.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

function buildForecast(analysis: ScenarioAnalysis): ForecastPoint[] {
  const trendChart = analysis.charts.find((chart) => chart.kind === "line") ?? analysis.charts[0];
  const key = trendChart?.yKeys[0];
  const data = trendChart?.data ?? [];
  const numericValues = data.map((item) => Number(item[key?.key ?? ""])).filter(Number.isFinite);
  const lastValue = numericValues[numericValues.length - 1] ?? 0;
  const recent = numericValues.slice(-4);
  const averageDelta =
    recent.length > 1
      ? recent.slice(1).reduce((total, value, index) => total + (value - recent[index]), 0) / (recent.length - 1)
      : 0;
  const lastDate = String(data[data.length - 1]?.[trendChart?.xKey ?? "date"] ?? "");

  return [1, 2, 3].map((offset) => {
    const value = Math.max(0, Math.round(lastValue + averageDelta * offset));
    const spread = Math.max(1, Math.abs(averageDelta) * 0.65 * offset);

    return {
      label: `T+${offset}`,
      date: nextDateLabel(lastDate, offset),
      value,
      optimistic: Math.round(value + spread),
      conservative: Math.max(0, Math.round(value - spread)),
      unit: key?.unit ?? ""
    };
  });
}

function scenarioActions(analysis: ScenarioAnalysis): ActionItem[] {
  const firstAlert = analysis.insights[0];
  const scenarioId = analysis.scenario.id;

  const actions: Record<ScenarioId, ActionItem[]> = {
    operations: [
      {
        id: "ops-peak-capacity",
        title: "复盘高峰骑手供给与配送半径",
        ownerRole: "区域运营负责人",
        priority: "P0",
        status: "推进中",
        relatedMetric: firstAlert?.metricName ?? "履约率",
        due: "48 小时内",
        impact: "降低超时率和客诉率"
      },
      {
        id: "ops-cost-sla",
        title: "重算高成本校区补贴与商家出餐 SLA",
        ownerRole: "经营分析负责人",
        priority: "P1",
        status: "待处理",
        relatedMetric: "成本率",
        due: "本周",
        impact: "控制履约成本率"
      },
      {
        id: "ops-penetration",
        title: "对低渗透校区设计宿舍楼栋活动",
        ownerRole: "校园运营",
        priority: "P2",
        status: "本周验证",
        relatedMetric: "渗透率",
        due: "7 天",
        impact: "提升新增订单密度"
      }
    ],
    conversion: [
      {
        id: "cv-budget-shift",
        title: "将预算从低转化渠道迁移到高意向渠道",
        ownerRole: "增长运营负责人",
        priority: "P0",
        status: "推进中",
        relatedMetric: firstAlert?.metricName ?? "成交转化率",
        due: "24 小时内",
        impact: "降低 CAC"
      },
      {
        id: "cv-landing-ab",
        title: "上线落地页卖点与试用承接 AB 实验",
        ownerRole: "产品运营",
        priority: "P1",
        status: "待处理",
        relatedMetric: "试用成交率",
        due: "本周",
        impact: "提升试用到成交效率"
      },
      {
        id: "cv-content-model",
        title: "沉淀高转化渠道人群和内容模型",
        ownerRole: "内容运营",
        priority: "P2",
        status: "本周验证",
        relatedMetric: "线索转化率",
        due: "7 天",
        impact: "提高线索质量"
      }
    ],
    feedback: [
      {
        id: "fb-issue-squad",
        title: "建立高频问题专项小组和升级机制",
        ownerRole: "产品运营负责人",
        priority: "P0",
        status: "推进中",
        relatedMetric: firstAlert?.metricName ?? "负向反馈占比",
        due: "24 小时内",
        impact: "压降负向反馈"
      },
      {
        id: "fb-rule-copy",
        title: "改版优惠券和退款规则提示文案",
        ownerRole: "产品经理",
        priority: "P1",
        status: "待处理",
        relatedMetric: "满意度",
        due: "本周",
        impact: "降低理解成本"
      },
      {
        id: "fb-service-sla",
        title: "对超 9 小时工单设置客服升级线",
        ownerRole: "客服运营",
        priority: "P1",
        status: "本周验证",
        relatedMetric: "平均处理时长",
        due: "3 天",
        impact: "减少未解决积压"
      }
    ]
  };

  return actions[scenarioId];
}

function findMetricIdByName(analysis: ScenarioAnalysis, metricName: string) {
  return analysis.metrics.find((metric) => metric.name === metricName || metricName.includes(metric.name) || metric.name.includes(metricName))?.id;
}

export function buildConstellationModel(analysis: ScenarioAnalysis, command: CommandCenterAnalysis): ConstellationModel {
  const scenarioNodeId = `scenario-${analysis.scenario.id}`;
  const nodes: ConstellationNode[] = [
    {
      id: scenarioNodeId,
      label: analysis.scenario.name,
      type: "scenario",
      status: command.healthScore.level,
      value: `${command.healthScore.score}`,
      description: `${analysis.scenario.shortName} · ${analysis.period} · ${command.healthScore.label}`
    },
    ...analysis.metrics.map((metric) => ({
      id: `metric-${metric.id}`,
      label: metric.name,
      type: "metric" as const,
      status: metric.status,
      value: `${metric.formattedValue}${metric.unit ? ` ${metric.unit}` : ""}`,
      description: `${metric.definition} 当前环比 ${metric.changeLabel}。`,
      linkedMetricId: metric.id
    })),
    ...command.alertQueue.slice(0, 5).map((alert) => {
      const linkedMetricId = findMetricIdByName(analysis, alert.metricName);
      const status: ConstellationNode["status"] = alert.severity === "critical" ? "risk" : alert.severity === "warning" ? "watch" : "normal";

      return {
        id: alert.id,
        label: alert.metricName,
        type: "alert" as const,
        priority: alert.priority,
        status,
        value: alert.priority,
        description: alert.title,
        linkedMetricId
      };
    }),
    ...command.actionItems.map((item) => {
      const linkedMetricId = findMetricIdByName(analysis, item.relatedMetric);

      return {
        id: item.id,
        label: item.title,
        type: "action" as const,
        priority: item.priority,
        status: item.status,
        value: item.due,
        description: `${item.ownerRole} · ${item.impact}`,
        linkedMetricId
      };
    })
  ];

  const links: ConstellationLink[] = [
    ...analysis.metrics.map((metric) => ({
      source: scenarioNodeId,
      target: `metric-${metric.id}`,
      strength: metric.status === "risk" ? 0.95 : metric.status === "watch" ? 0.78 : 0.58
    })),
    ...command.alertQueue.slice(0, 5).map((alert) => {
      const linkedMetricId = findMetricIdByName(analysis, alert.metricName);

      return {
        source: linkedMetricId ? `metric-${linkedMetricId}` : scenarioNodeId,
        target: alert.id,
        strength: alert.priority === "P0" ? 1 : alert.priority === "P1" ? 0.82 : 0.62
      };
    }),
    ...command.actionItems.map((item) => {
      const linkedMetricId = findMetricIdByName(analysis, item.relatedMetric);
      const matchedAlert = command.alertQueue.find((alert) => alert.metricName === item.relatedMetric || item.relatedMetric.includes(alert.metricName));

      return {
        source: matchedAlert?.id ?? (linkedMetricId ? `metric-${linkedMetricId}` : scenarioNodeId),
        target: item.id,
        strength: item.priority === "P0" ? 0.92 : item.priority === "P1" ? 0.74 : 0.56
      };
    })
  ];

  return {
    nodes,
    links,
    selectedNodeId: scenarioNodeId
  };
}

export function buildCommandCenterAnalysis(analysis: ScenarioAnalysis): CommandCenterAnalysis {
  const healthScore = buildHealthScore(analysis);
  const alertQueue = buildAlerts(analysis);
  const actionItems = scenarioActions(analysis);
  const riskCount = alertQueue.length;
  const openActionCount = actionItems.filter((item) => item.status !== "本周验证").length;

  return {
    healthScore,
    alertQueue,
    forecast: buildForecast(analysis),
    actionItems,
    executiveBrief: `${analysis.period}，${analysis.scenario.name}健康分 ${healthScore.score}，当前需要重点处理 ${alertQueue[0]?.metricName ?? "结构性波动"}，建议优先推进 ${actionItems[0]?.title ?? "核心行动项"}。`,
    riskCount,
    openActionCount
  };
}

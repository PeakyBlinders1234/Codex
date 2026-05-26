import {
  conversionRows,
  feedbackRows,
  operationRows,
  scenarioMap
} from "@/data/scenarios";
import {
  ChartSeries,
  ConversionRow,
  FeedbackRow,
  Metric,
  OperationRow,
  ScenarioAnalysis,
  ScenarioId
} from "@/types";
import {
  changeRate,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRateChange
} from "./format";
import { InsightEngine } from "./insight-engine";

const metricSql = {
  orders: `SELECT SUM(orders) AS orders
FROM mock_ops_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  revenue: `SELECT SUM(revenue) AS revenue
FROM mock_ops_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  fulfillmentRate: `SELECT SUM(orders * fulfillment_rate) / SUM(orders) AS fulfillment_rate
FROM mock_ops_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  costRate: `SELECT SUM(rider_cost) / SUM(revenue) AS cost_rate
FROM mock_ops_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  complaintRate: `SELECT SUM(complaints) / SUM(orders) AS complaint_rate
FROM mock_ops_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  penetrationRate: `SELECT SUM(orders * penetration_rate) / SUM(orders) AS penetration_rate
FROM mock_ops_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  exposures: `SELECT SUM(exposures) AS exposures
FROM mock_conversion_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  leadRate: `SELECT SUM(leads) / SUM(exposures) AS lead_rate
FROM mock_conversion_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  dealRate: `SELECT SUM(deals) / SUM(exposures) AS deal_rate
FROM mock_conversion_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  cac: `SELECT SUM(spend) / NULLIF(SUM(deals), 0) AS cac
FROM mock_conversion_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  dealAmount: `SELECT SUM(deal_amount) AS deal_amount
FROM mock_conversion_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  trialDealRate: `SELECT SUM(deals) / NULLIF(SUM(trials), 0) AS trial_deal_rate
FROM mock_conversion_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  feedbackCount: `SELECT SUM(count) AS feedback_count
FROM mock_feedback_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  negativeRate: `SELECT SUM(CASE WHEN sentiment = '负向' THEN count ELSE 0 END) / SUM(count) AS negative_rate
FROM mock_feedback_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  processHours: `SELECT SUM(average_process_hours * count) / SUM(count) AS avg_process_hours
FROM mock_feedback_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  satisfaction: `SELECT SUM(average_satisfaction * count) / SUM(count) AS satisfaction
FROM mock_feedback_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  unresolved: `SELECT SUM(count - resolved_count) AS unresolved_count
FROM mock_feedback_daily
WHERE date BETWEEN :start_date AND :end_date;`,
  topIssue: `SELECT issue_type, SUM(count) AS issue_count
FROM mock_feedback_daily
WHERE date BETWEEN :start_date AND :end_date
GROUP BY issue_type
ORDER BY issue_count DESC
LIMIT 1;`
};

function splitPeriods<T extends { date: string }>(rows: T[]) {
  const uniqueDates = Array.from(new Set(rows.map((row) => row.date))).sort();
  const midpoint = Math.floor(uniqueDates.length / 2);
  const previousDates = new Set(uniqueDates.slice(0, midpoint));
  const currentDates = new Set(uniqueDates.slice(midpoint));

  return {
    previousRows: rows.filter((row) => previousDates.has(row.date)),
    currentRows: rows.filter((row) => currentDates.has(row.date)),
    currentDates: uniqueDates.slice(midpoint),
    previousDates: uniqueDates.slice(0, midpoint)
  };
}

function sum<T>(rows: T[], selector: (row: T) => number) {
  return rows.reduce((total, row) => total + selector(row), 0);
}

function weightedAverage<T>(rows: T[], value: (row: T) => number, weight: (row: T) => number) {
  const denominator = sum(rows, weight);
  if (denominator === 0) return 0;

  return sum(rows, (row) => value(row) * weight(row)) / denominator;
}

function metric(
  id: string,
  name: string,
  value: number,
  previous: number,
  unit: string,
  formattedValue: string,
  definition: string,
  sql: string,
  goodDirection: "up" | "down",
  status: Metric["status"]
): Metric {
  const rate = changeRate(value, previous);

  return {
    id,
    name,
    value,
    formattedValue,
    unit,
    changeRate: rate,
    changeLabel: formatRateChange(rate),
    status,
    definition,
    sql,
    goodDirection
  };
}

function byDate<T extends { date: string }>(rows: T[], mapper: (dateRows: T[]) => Record<string, number>) {
  const dateMap = new Map<string, T[]>();
  rows.forEach((row) => {
    dateMap.set(row.date, [...(dateMap.get(row.date) ?? []), row]);
  });

  return Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dateRows]) => ({ date, ...mapper(dateRows) }));
}

function buildOperationsAnalysis(): ScenarioAnalysis {
  const { currentRows, previousRows, currentDates } = splitPeriods(operationRows);
  const currentOrders = sum(currentRows, (row) => row.orders);
  const previousOrders = sum(previousRows, (row) => row.orders);
  const currentRevenue = sum(currentRows, (row) => row.revenue);
  const previousRevenue = sum(previousRows, (row) => row.revenue);
  const currentCost = sum(currentRows, (row) => row.riderCost);
  const previousCost = sum(previousRows, (row) => row.riderCost);
  const currentComplaints = sum(currentRows, (row) => row.complaints);
  const previousComplaints = sum(previousRows, (row) => row.complaints);
  const currentFulfillment = weightedAverage(currentRows, (row) => row.fulfillmentRate, (row) => row.orders);
  const previousFulfillment = weightedAverage(previousRows, (row) => row.fulfillmentRate, (row) => row.orders);
  const currentPenetration = weightedAverage(currentRows, (row) => row.penetrationRate, (row) => row.orders);
  const previousPenetration = weightedAverage(previousRows, (row) => row.penetrationRate, (row) => row.orders);

  const costRate = currentCost / currentRevenue;
  const previousCostRate = previousCost / previousRevenue;
  const complaintRate = currentComplaints / currentOrders;
  const previousComplaintRate = previousComplaints / previousOrders;

  const metrics: Metric[] = [
    metric(
      "orders",
      "订单量",
      currentOrders,
      previousOrders,
      "单",
      formatNumber(currentOrders),
      "统计周期内全部校区完成下单的订单总量，用于判断需求规模。",
      metricSql.orders,
      "up",
      changeRate(currentOrders, previousOrders) < -0.1 ? "risk" : "normal"
    ),
    metric(
      "revenue",
      "收入",
      currentRevenue,
      previousRevenue,
      "元",
      formatCurrency(currentRevenue),
      "订单实付收入合计，反映本地生活业务经营规模。",
      metricSql.revenue,
      "up",
      changeRate(currentRevenue, previousRevenue) < -0.1 ? "risk" : "normal"
    ),
    metric(
      "fulfillmentRate",
      "履约率",
      currentFulfillment,
      previousFulfillment,
      "%",
      formatPercent(currentFulfillment),
      "履约订单量 / 总订单量，衡量骑手供给和配送稳定性。",
      metricSql.fulfillmentRate,
      "up",
      currentFulfillment < 0.93 ? "risk" : currentFulfillment < 0.95 ? "watch" : "normal"
    ),
    metric(
      "costRate",
      "成本率",
      costRate,
      previousCostRate,
      "%",
      formatPercent(costRate),
      "骑手成本 / 订单收入，衡量履约投入是否侵蚀毛利。",
      metricSql.costRate,
      "down",
      costRate > 0.36 ? "risk" : costRate > 0.33 ? "watch" : "normal"
    ),
    metric(
      "complaintRate",
      "客诉率",
      complaintRate,
      previousComplaintRate,
      "%",
      formatPercent(complaintRate, 2),
      "客诉数 / 订单量，衡量用户体验和异常履约影响。",
      metricSql.complaintRate,
      "down",
      complaintRate > 0.018 ? "risk" : complaintRate > 0.012 ? "watch" : "normal"
    ),
    metric(
      "penetrationRate",
      "渗透率",
      currentPenetration,
      previousPenetration,
      "%",
      formatPercent(currentPenetration),
      "活跃下单用户 / 校区可触达用户，衡量业务覆盖深度。",
      metricSql.penetrationRate,
      "up",
      changeRate(currentPenetration, previousPenetration) < -0.05 ? "watch" : "normal"
    )
  ];

  const trendData = byDate(operationRows, (rows) => ({
    orders: sum(rows, (row) => row.orders),
    revenue: sum(rows, (row) => row.revenue),
    fulfillmentRate: Number((weightedAverage(rows, (row) => row.fulfillmentRate, (row) => row.orders) * 100).toFixed(1))
  }));

  const campusData = Array.from(new Set(currentRows.map((row) => row.campus))).map((campus) => {
    const rows = currentRows.filter((row) => row.campus === campus);
    const orders = sum(rows, (row) => row.orders);
    const revenue = sum(rows, (row) => row.revenue);
    return {
      campus,
      orders,
      costRate: Number(((sum(rows, (row) => row.riderCost) / revenue) * 100).toFixed(1)),
      complaintRate: Number(((sum(rows, (row) => row.complaints) / orders) * 100).toFixed(2)),
      fulfillmentRate: Number((weightedAverage(rows, (row) => row.fulfillmentRate, (row) => row.orders) * 100).toFixed(1))
    };
  });

  const charts: ChartSeries[] = [
    {
      id: "ops-trend",
      title: "订单与履约趋势",
      description: "观察订单增长是否伴随履约稳定性变化。",
      kind: "line",
      xKey: "date",
      yKeys: [
        { key: "orders", name: "订单量", color: "#0f9f8f", unit: "单" },
        { key: "fulfillmentRate", name: "履约率", color: "#2563eb", unit: "%" }
      ],
      data: trendData
    },
    {
      id: "ops-campus",
      title: "校区经营对比",
      description: "定位高成本、高客诉或履约偏低的区域。",
      kind: "bar",
      xKey: "campus",
      yKeys: [
        { key: "orders", name: "订单量", color: "#0f9f8f", unit: "单" },
        { key: "costRate", name: "成本率", color: "#f97316", unit: "%" }
      ],
      data: campusData
    },
    {
      id: "ops-risk",
      title: "区域风险排行",
      description: "优先处理成本率和客诉率同时偏高的校区。",
      kind: "ranking",
      xKey: "campus",
      yKeys: [
        { key: "complaintRate", name: "客诉率", color: "#e11d48", unit: "%" },
        { key: "fulfillmentRate", name: "履约率", color: "#2563eb", unit: "%" }
      ],
      data: campusData
    }
  ];

  const analysis = {
    scenario: scenarioMap.operations,
    period: `${currentDates[0]} 至 ${currentDates[currentDates.length - 1]}`,
    metrics,
    charts,
    insights: []
  };

  return { ...analysis, insights: InsightEngine.generate(analysis) };
}

function buildConversionAnalysis(): ScenarioAnalysis {
  const { currentRows, previousRows, currentDates } = splitPeriods(conversionRows);
  const currentExposures = sum(currentRows, (row) => row.exposures);
  const previousExposures = sum(previousRows, (row) => row.exposures);
  const currentLeads = sum(currentRows, (row) => row.leads);
  const previousLeads = sum(previousRows, (row) => row.leads);
  const currentDeals = sum(currentRows, (row) => row.deals);
  const previousDeals = sum(previousRows, (row) => row.deals);
  const currentSpend = sum(currentRows, (row) => row.spend);
  const previousSpend = sum(previousRows, (row) => row.spend);
  const currentAmount = sum(currentRows, (row) => row.dealAmount);
  const previousAmount = sum(previousRows, (row) => row.dealAmount);
  const currentTrials = sum(currentRows, (row) => row.trials);
  const previousTrials = sum(previousRows, (row) => row.trials);
  const leadRate = currentLeads / currentExposures;
  const previousLeadRate = previousLeads / previousExposures;
  const dealRate = currentDeals / currentExposures;
  const previousDealRate = previousDeals / previousExposures;
  const cac = currentSpend / currentDeals;
  const previousCac = previousSpend / previousDeals;
  const trialDealRate = currentDeals / currentTrials;
  const previousTrialDealRate = previousDeals / previousTrials;

  const metrics: Metric[] = [
    metric(
      "exposures",
      "曝光量",
      currentExposures,
      previousExposures,
      "次",
      formatNumber(currentExposures),
      "各渠道触达用户次数合计，用于观察增长入口规模。",
      metricSql.exposures,
      "up",
      changeRate(currentExposures, previousExposures) < -0.1 ? "risk" : "normal"
    ),
    metric(
      "leadRate",
      "线索转化率",
      leadRate,
      previousLeadRate,
      "%",
      formatPercent(leadRate),
      "线索数 / 曝光量，衡量渠道素材和落地页承接效率。",
      metricSql.leadRate,
      "up",
      changeRate(leadRate, previousLeadRate) < -0.1 ? "risk" : changeRate(leadRate, previousLeadRate) < -0.04 ? "watch" : "normal"
    ),
    metric(
      "dealRate",
      "成交转化率",
      dealRate,
      previousDealRate,
      "%",
      formatPercent(dealRate, 2),
      "成交数 / 曝光量，衡量从触达到付费的整体效率。",
      metricSql.dealRate,
      "up",
      dealRate < 0.0022 ? "risk" : dealRate < 0.0028 ? "watch" : "normal"
    ),
    metric(
      "cac",
      "CAC",
      cac,
      previousCac,
      "元/单",
      `¥${cac.toFixed(1)}`,
      "投放成本 / 成交数，衡量单个成交客户的获客成本。",
      metricSql.cac,
      "down",
      cac > 32 ? "risk" : cac > 24 ? "watch" : "normal"
    ),
    metric(
      "dealAmount",
      "成交金额",
      currentAmount,
      previousAmount,
      "元",
      formatCurrency(currentAmount),
      "成交订单对应的付费金额合计，衡量渠道商业产出。",
      metricSql.dealAmount,
      "up",
      changeRate(currentAmount, previousAmount) < -0.1 ? "risk" : "normal"
    ),
    metric(
      "trialDealRate",
      "试用成交率",
      trialDealRate,
      previousTrialDealRate,
      "%",
      formatPercent(trialDealRate),
      "成交数 / 试用数，衡量产品体验后的付费转化效率。",
      metricSql.trialDealRate,
      "up",
      changeRate(trialDealRate, previousTrialDealRate) < -0.1 ? "risk" : changeRate(trialDealRate, previousTrialDealRate) < -0.04 ? "watch" : "normal"
    )
  ];

  const trendData = byDate(conversionRows, (rows) => ({
    exposures: sum(rows, (row) => row.exposures),
    deals: sum(rows, (row) => row.deals),
    dealAmount: sum(rows, (row) => row.dealAmount)
  }));

  const channelData = Array.from(new Set(currentRows.map((row) => row.channel))).map((channel) => {
    const rows = currentRows.filter((row) => row.channel === channel);
    const exposures = sum(rows, (row) => row.exposures);
    const deals = sum(rows, (row) => row.deals);
    return {
      channel,
      dealRate: Number(((deals / exposures) * 100).toFixed(2)),
      leads: sum(rows, (row) => row.leads),
      cac: Number((sum(rows, (row) => row.spend) / deals).toFixed(1)),
      amount: sum(rows, (row) => row.dealAmount)
    };
  });

  const funnelData = [
    { stage: "曝光", value: currentExposures },
    { stage: "线索", value: currentLeads },
    { stage: "注册", value: sum(currentRows, (row) => row.registrations) },
    { stage: "试用", value: currentTrials },
    { stage: "成交", value: currentDeals }
  ];

  const charts: ChartSeries[] = [
    {
      id: "conversion-trend",
      title: "曝光与成交趋势",
      description: "观察上游规模扩大后，成交是否同步增长。",
      kind: "line",
      xKey: "date",
      yKeys: [
        { key: "exposures", name: "曝光", color: "#0f9f8f", unit: "次" },
        { key: "deals", name: "成交", color: "#2563eb", unit: "单" }
      ],
      data: trendData
    },
    {
      id: "conversion-channel",
      title: "渠道转化对比",
      description: "定位高成本或低成交效率渠道。",
      kind: "bar",
      xKey: "channel",
      yKeys: [
        { key: "dealRate", name: "成交转化率", color: "#0f9f8f", unit: "%" },
        { key: "cac", name: "CAC", color: "#f97316", unit: "元" }
      ],
      data: channelData
    },
    {
      id: "conversion-funnel",
      title: "曝光到成交漏斗",
      description: "展示转化链路每一步的规模损耗。",
      kind: "funnel",
      xKey: "stage",
      yKeys: [{ key: "value", name: "人数/次数", color: "#0f9f8f" }],
      data: funnelData
    }
  ];

  const analysis = {
    scenario: scenarioMap.conversion,
    period: `${currentDates[0]} 至 ${currentDates[currentDates.length - 1]}`,
    metrics,
    charts,
    insights: []
  };

  return { ...analysis, insights: InsightEngine.generate(analysis) };
}

function buildFeedbackAnalysis(): ScenarioAnalysis {
  const { currentRows, previousRows, currentDates } = splitPeriods(feedbackRows);
  const currentCount = sum(currentRows, (row) => row.count);
  const previousCount = sum(previousRows, (row) => row.count);
  const currentNegative = sum(currentRows, (row) => (row.sentiment === "负向" ? row.count : 0));
  const previousNegative = sum(previousRows, (row) => (row.sentiment === "负向" ? row.count : 0));
  const currentUnresolved = sum(currentRows, (row) => row.count - row.resolvedCount);
  const previousUnresolved = sum(previousRows, (row) => row.count - row.resolvedCount);
  const negativeRate = currentNegative / currentCount;
  const previousNegativeRate = previousNegative / previousCount;
  const processHours = weightedAverage(currentRows, (row) => row.averageProcessHours, (row) => row.count);
  const previousProcessHours = weightedAverage(previousRows, (row) => row.averageProcessHours, (row) => row.count);
  const satisfaction = weightedAverage(currentRows, (row) => row.averageSatisfaction, (row) => row.count);
  const previousSatisfaction = weightedAverage(previousRows, (row) => row.averageSatisfaction, (row) => row.count);

  const issueCounts = Array.from(new Set(currentRows.map((row) => row.issueType)))
    .map((issueType) => ({
      issueType,
      count: sum(
        currentRows.filter((row) => row.issueType === issueType),
        (row) => row.count
      )
    }))
    .sort((a, b) => b.count - a.count);

  const topIssueCount = issueCounts[0]?.count ?? 0;
  const previousTopIssueCount = Math.max(
    ...Array.from(new Set(previousRows.map((row) => row.issueType))).map((issueType) =>
      sum(
        previousRows.filter((row) => row.issueType === issueType),
        (row) => row.count
      )
    )
  );

  const metrics: Metric[] = [
    metric(
      "feedbackCount",
      "反馈量",
      currentCount,
      previousCount,
      "条",
      formatNumber(currentCount),
      "统计周期内来自 App、客服、问卷和社群的用户反馈总量。",
      metricSql.feedbackCount,
      "down",
      changeRate(currentCount, previousCount) > 0.2 ? "watch" : "normal"
    ),
    metric(
      "negativeRate",
      "负向反馈占比",
      negativeRate,
      previousNegativeRate,
      "%",
      formatPercent(negativeRate),
      "负向反馈数 / 全部反馈数，衡量用户情绪风险。",
      metricSql.negativeRate,
      "down",
      negativeRate > 0.42 ? "risk" : negativeRate > 0.34 ? "watch" : "normal"
    ),
    metric(
      "processHours",
      "平均处理时长",
      processHours,
      previousProcessHours,
      "小时",
      `${processHours.toFixed(1)}h`,
      "按反馈量加权的平均处理时长，衡量运营处理效率。",
      metricSql.processHours,
      "down",
      processHours > 9 ? "risk" : processHours > 7 ? "watch" : "normal"
    ),
    metric(
      "satisfaction",
      "满意度",
      satisfaction,
      previousSatisfaction,
      "分",
      `${satisfaction.toFixed(2)} / 5`,
      "按反馈量加权的用户满意度评分，满分 5 分。",
      metricSql.satisfaction,
      "up",
      satisfaction < 3.5 ? "risk" : satisfaction < 3.8 ? "watch" : "normal"
    ),
    metric(
      "unresolved",
      "未解决问题",
      currentUnresolved,
      previousUnresolved,
      "条",
      formatNumber(currentUnresolved),
      "反馈总量 - 已解决反馈量，衡量待处理问题积压。",
      metricSql.unresolved,
      "down",
      changeRate(currentUnresolved, previousUnresolved) > 0.25 ? "risk" : changeRate(currentUnresolved, previousUnresolved) > 0.1 ? "watch" : "normal"
    ),
    metric(
      "topIssue",
      "最高频问题",
      topIssueCount,
      previousTopIssueCount,
      "条",
      `${issueCounts[0]?.issueType ?? "暂无"} · ${formatNumber(topIssueCount)}`,
      "按问题类型聚合反馈量，取当前周期反馈数最高的问题类型。",
      metricSql.topIssue,
      "down",
      topIssueCount > 280 ? "risk" : topIssueCount > 220 ? "watch" : "normal"
    )
  ];

  const trendData = byDate(feedbackRows, (rows) => {
    const count = sum(rows, (row) => row.count);
    return {
      feedbackCount: count,
      negativeRate: Number(((sum(rows, (row) => (row.sentiment === "负向" ? row.count : 0)) / count) * 100).toFixed(1)),
      satisfaction: Number(weightedAverage(rows, (row) => row.averageSatisfaction, (row) => row.count).toFixed(2))
    };
  });

  const sourceData = Array.from(new Set(currentRows.map((row) => row.source))).map((source) => {
    const rows = currentRows.filter((row) => row.source === source);
    const count = sum(rows, (row) => row.count);
    return {
      source,
      count,
      negativeRate: Number(((sum(rows, (row) => (row.sentiment === "负向" ? row.count : 0)) / count) * 100).toFixed(1)),
      satisfaction: Number(weightedAverage(rows, (row) => row.averageSatisfaction, (row) => row.count).toFixed(2))
    };
  });

  const charts: ChartSeries[] = [
    {
      id: "feedback-trend",
      title: "反馈情绪趋势",
      description: "观察反馈量增长是否伴随负向情绪上升。",
      kind: "line",
      xKey: "date",
      yKeys: [
        { key: "feedbackCount", name: "反馈量", color: "#0f9f8f", unit: "条" },
        { key: "negativeRate", name: "负向占比", color: "#e11d48", unit: "%" }
      ],
      data: trendData
    },
    {
      id: "feedback-source",
      title: "反馈来源对比",
      description: "识别主要反馈入口和情绪风险来源。",
      kind: "bar",
      xKey: "source",
      yKeys: [
        { key: "count", name: "反馈量", color: "#0f9f8f", unit: "条" },
        { key: "negativeRate", name: "负向占比", color: "#e11d48", unit: "%" }
      ],
      data: sourceData
    },
    {
      id: "feedback-issue",
      title: "高频问题类型",
      description: "将产品优化优先级落到具体问题类型。",
      kind: "ranking",
      xKey: "issueType",
      yKeys: [{ key: "count", name: "反馈量", color: "#0f9f8f", unit: "条" }],
      data: issueCounts
    }
  ];

  const analysis = {
    scenario: scenarioMap.feedback,
    period: `${currentDates[0]} 至 ${currentDates[currentDates.length - 1]}`,
    metrics,
    charts,
    insights: []
  };

  return { ...analysis, insights: InsightEngine.generate(analysis) };
}

export function buildScenarioAnalysis(scenarioId: ScenarioId): ScenarioAnalysis {
  const builders: Record<ScenarioId, () => ScenarioAnalysis> = {
    operations: buildOperationsAnalysis,
    conversion: buildConversionAnalysis,
    feedback: buildFeedbackAnalysis
  };

  return builders[scenarioId]();
}

export function getScenarioRawRows(scenarioId: ScenarioId): OperationRow[] | ConversionRow[] | FeedbackRow[] {
  const rows = {
    operations: operationRows,
    conversion: conversionRows,
    feedback: feedbackRows
  };

  return rows[scenarioId];
}

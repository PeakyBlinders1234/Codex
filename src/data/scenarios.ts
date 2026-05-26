import type { ConversionRow, FeedbackRow, OperationRow, Scenario, ScenarioId } from "@/types";

export const scenarios: Scenario[] = [
  {
    id: "operations",
    name: "经营分析",
    shortName: "校园配送",
    description: "围绕校园配送/本地生活业务，监控订单、收入、履约、成本、客诉和渗透率。",
    audience: "数据运营 / 运营分析",
    tableName: "mock_ops_daily"
  },
  {
    id: "conversion",
    name: "转化分析",
    shortName: "增长转化",
    description: "分析曝光到成交的全链路漏斗，识别低效渠道和获客成本异常。",
    audience: "产品运营 / 增长分析",
    tableName: "mock_conversion_daily"
  },
  {
    id: "feedback",
    name: "用户反馈",
    shortName: "产品反馈",
    description: "聚合用户反馈、情绪、处理效率和满意度，形成产品优化优先级。",
    audience: "产品经理 / 产品运营",
    tableName: "mock_feedback_daily"
  }
];

export const scenarioMap: Record<ScenarioId, Scenario> = scenarios.reduce(
  (acc, scenario) => ({ ...acc, [scenario.id]: scenario }),
  {} as Record<ScenarioId, Scenario>
);

const dates = [
  "05-06",
  "05-07",
  "05-08",
  "05-09",
  "05-10",
  "05-11",
  "05-12",
  "05-13",
  "05-14",
  "05-15",
  "05-16",
  "05-17",
  "05-18",
  "05-19"
];

const campusProfiles = [
  {
    campus: "东区",
    orders: [820, 846, 858, 872, 890, 902, 918, 936, 958, 974, 982, 990, 1012, 1024],
    price: 18.6,
    fulfillment: [0.954, 0.958, 0.956, 0.961, 0.959, 0.962, 0.965, 0.963, 0.966, 0.968, 0.967, 0.969, 0.971, 0.972],
    timeout: [0.036, 0.034, 0.035, 0.031, 0.032, 0.03, 0.029, 0.029, 0.027, 0.026, 0.025, 0.024, 0.024, 0.023],
    costRate: [0.298, 0.296, 0.294, 0.292, 0.291, 0.289, 0.287, 0.286, 0.284, 0.282, 0.281, 0.28, 0.278, 0.277],
    complaints: [9, 8, 8, 7, 7, 7, 6, 6, 6, 5, 5, 5, 5, 5],
    penetration: [0.188, 0.192, 0.196, 0.199, 0.203, 0.207, 0.211, 0.216, 0.221, 0.224, 0.228, 0.231, 0.236, 0.24]
  },
  {
    campus: "南湖",
    orders: [640, 652, 660, 668, 675, 690, 704, 712, 720, 728, 734, 740, 744, 748],
    price: 17.8,
    fulfillment: [0.946, 0.947, 0.949, 0.95, 0.948, 0.951, 0.952, 0.949, 0.947, 0.944, 0.942, 0.94, 0.938, 0.936],
    timeout: [0.044, 0.043, 0.042, 0.041, 0.043, 0.04, 0.039, 0.043, 0.047, 0.052, 0.056, 0.059, 0.061, 0.064],
    costRate: [0.324, 0.323, 0.322, 0.321, 0.323, 0.326, 0.328, 0.331, 0.338, 0.346, 0.352, 0.357, 0.361, 0.365],
    complaints: [7, 7, 8, 8, 8, 9, 9, 10, 11, 12, 13, 13, 14, 15],
    penetration: [0.154, 0.157, 0.16, 0.162, 0.164, 0.167, 0.17, 0.171, 0.173, 0.174, 0.176, 0.177, 0.178, 0.179]
  },
  {
    campus: "医学院",
    orders: [420, 430, 436, 444, 452, 458, 466, 470, 472, 468, 462, 456, 448, 442],
    price: 19.4,
    fulfillment: [0.938, 0.94, 0.941, 0.943, 0.944, 0.945, 0.946, 0.94, 0.936, 0.931, 0.925, 0.919, 0.913, 0.908],
    timeout: [0.048, 0.047, 0.046, 0.045, 0.044, 0.043, 0.042, 0.049, 0.055, 0.061, 0.068, 0.074, 0.081, 0.087],
    costRate: [0.336, 0.334, 0.333, 0.332, 0.331, 0.33, 0.329, 0.337, 0.346, 0.355, 0.363, 0.371, 0.379, 0.386],
    complaints: [5, 5, 5, 5, 6, 6, 6, 7, 8, 9, 10, 11, 12, 13],
    penetration: [0.122, 0.124, 0.126, 0.128, 0.13, 0.132, 0.134, 0.134, 0.133, 0.132, 0.131, 0.129, 0.128, 0.126]
  }
];

export const operationRows: OperationRow[] = dates.flatMap((date, index) =>
  campusProfiles.map((profile) => {
    const orders = profile.orders[index];
    const revenue = Math.round(orders * profile.price);
    const riderCost = Math.round(revenue * profile.costRate[index]);

    return {
      date,
      campus: profile.campus,
      orders,
      revenue,
      fulfillmentRate: profile.fulfillment[index],
      timeoutRate: profile.timeout[index],
      riderCost,
      commissionRevenue: Math.round(revenue * 0.085),
      complaints: profile.complaints[index],
      penetrationRate: profile.penetration[index]
    };
  })
);

const channelProfiles = [
  {
    channel: "搜索广告",
    exposure: [42000, 43600, 45100, 46300, 47200, 48600, 50100, 51400, 52900, 53800, 54700, 55300, 56200, 56800],
    leadRate: [0.052, 0.053, 0.053, 0.054, 0.054, 0.055, 0.056, 0.055, 0.054, 0.053, 0.052, 0.051, 0.05, 0.049],
    regRate: 0.62,
    trialRate: 0.42,
    dealRate: [0.19, 0.19, 0.2, 0.2, 0.2, 0.2, 0.21, 0.19, 0.18, 0.17, 0.165, 0.16, 0.155, 0.15],
    spendPerExposure: 0.018,
    amountPerDeal: 980
  },
  {
    channel: "小红书",
    exposure: [26000, 27100, 28600, 29500, 30600, 31800, 33000, 34800, 36200, 37800, 39400, 40800, 42100, 43800],
    leadRate: [0.041, 0.042, 0.043, 0.044, 0.045, 0.046, 0.047, 0.049, 0.05, 0.052, 0.053, 0.055, 0.056, 0.057],
    regRate: 0.66,
    trialRate: 0.48,
    dealRate: [0.16, 0.165, 0.168, 0.17, 0.172, 0.175, 0.178, 0.18, 0.184, 0.188, 0.19, 0.194, 0.198, 0.202],
    spendPerExposure: 0.012,
    amountPerDeal: 860
  },
  {
    channel: "社群转介绍",
    exposure: [8800, 9100, 9400, 9700, 10100, 10400, 10800, 11200, 11700, 12100, 12600, 13000, 13400, 13900],
    leadRate: [0.085, 0.086, 0.088, 0.089, 0.09, 0.092, 0.094, 0.096, 0.098, 0.1, 0.102, 0.104, 0.106, 0.108],
    regRate: 0.74,
    trialRate: 0.56,
    dealRate: [0.25, 0.252, 0.254, 0.257, 0.26, 0.262, 0.265, 0.268, 0.272, 0.275, 0.278, 0.281, 0.284, 0.287],
    spendPerExposure: 0.004,
    amountPerDeal: 920
  },
  {
    channel: "校园地推",
    exposure: [16800, 17200, 17600, 18100, 18500, 19000, 19400, 19600, 19800, 19900, 20100, 20300, 20400, 20500],
    leadRate: [0.066, 0.067, 0.068, 0.068, 0.069, 0.07, 0.071, 0.07, 0.069, 0.067, 0.065, 0.063, 0.061, 0.059],
    regRate: 0.58,
    trialRate: 0.39,
    dealRate: [0.17, 0.172, 0.173, 0.174, 0.174, 0.175, 0.176, 0.164, 0.153, 0.142, 0.134, 0.127, 0.121, 0.116],
    spendPerExposure: 0.009,
    amountPerDeal: 760
  }
];

export const conversionRows: ConversionRow[] = dates.flatMap((date, index) =>
  channelProfiles.map((profile) => {
    const exposures = profile.exposure[index];
    const leads = Math.round(exposures * profile.leadRate[index]);
    const registrations = Math.round(leads * profile.regRate);
    const trials = Math.round(registrations * profile.trialRate);
    const deals = Math.round(trials * profile.dealRate[index]);

    return {
      date,
      channel: profile.channel,
      exposures,
      leads,
      registrations,
      trials,
      deals,
      dealAmount: deals * profile.amountPerDeal,
      spend: Math.round(exposures * profile.spendPerExposure)
    };
  })
);

const feedbackProfiles = [
  {
    source: "App 内反馈",
    issueType: "配送时效",
    sentiment: "负向" as const,
    counts: [26, 24, 25, 23, 24, 22, 21, 27, 31, 35, 39, 42, 45, 49],
    hours: [9.8, 9.5, 9.4, 9.1, 8.8, 8.6, 8.4, 9.6, 10.5, 11.2, 12.3, 13.4, 14.1, 14.8],
    satisfaction: [3.7, 3.75, 3.8, 3.84, 3.86, 3.9, 3.92, 3.6, 3.45, 3.32, 3.18, 3.06, 2.95, 2.88],
    resolvedRate: [0.82, 0.84, 0.85, 0.86, 0.87, 0.88, 0.89, 0.8, 0.76, 0.72, 0.68, 0.64, 0.61, 0.58]
  },
  {
    source: "客服工单",
    issueType: "退款规则",
    sentiment: "负向" as const,
    counts: [18, 19, 20, 18, 17, 18, 17, 19, 20, 21, 22, 23, 24, 24],
    hours: [7.2, 7, 6.9, 6.8, 6.7, 6.5, 6.4, 6.6, 6.8, 7, 7.2, 7.5, 7.8, 8],
    satisfaction: [3.6, 3.62, 3.65, 3.66, 3.68, 3.7, 3.72, 3.68, 3.62, 3.55, 3.48, 3.4, 3.36, 3.32],
    resolvedRate: [0.86, 0.86, 0.87, 0.88, 0.88, 0.89, 0.9, 0.88, 0.86, 0.85, 0.83, 0.81, 0.79, 0.78]
  },
  {
    source: "问卷",
    issueType: "活动理解",
    sentiment: "中性" as const,
    counts: [34, 36, 35, 37, 38, 39, 40, 41, 42, 42, 43, 44, 45, 46],
    hours: [4.8, 4.7, 4.6, 4.5, 4.5, 4.4, 4.3, 4.2, 4.2, 4.1, 4.1, 4, 4, 3.9],
    satisfaction: [4.1, 4.12, 4.14, 4.15, 4.16, 4.18, 4.2, 4.22, 4.23, 4.24, 4.25, 4.27, 4.28, 4.3],
    resolvedRate: [0.91, 0.91, 0.92, 0.92, 0.92, 0.93, 0.93, 0.93, 0.94, 0.94, 0.94, 0.95, 0.95, 0.95]
  },
  {
    source: "社群",
    issueType: "功能建议",
    sentiment: "正向" as const,
    counts: [16, 17, 18, 19, 18, 20, 21, 22, 23, 24, 25, 25, 26, 27],
    hours: [5.2, 5.1, 5, 4.9, 4.8, 4.7, 4.6, 4.6, 4.5, 4.4, 4.4, 4.3, 4.2, 4.2],
    satisfaction: [4.25, 4.28, 4.3, 4.32, 4.34, 4.36, 4.38, 4.4, 4.41, 4.42, 4.44, 4.45, 4.46, 4.48],
    resolvedRate: [0.93, 0.93, 0.94, 0.94, 0.94, 0.95, 0.95, 0.95, 0.95, 0.96, 0.96, 0.96, 0.96, 0.97]
  },
  {
    source: "客服工单",
    issueType: "优惠券不可用",
    sentiment: "负向" as const,
    counts: [12, 13, 13, 14, 14, 15, 15, 17, 19, 21, 24, 27, 29, 31],
    hours: [6.1, 6, 5.9, 5.8, 5.8, 5.7, 5.7, 6.4, 7.1, 7.9, 8.8, 9.6, 10.4, 11],
    satisfaction: [3.85, 3.86, 3.88, 3.9, 3.9, 3.92, 3.94, 3.72, 3.55, 3.38, 3.2, 3.05, 2.92, 2.8],
    resolvedRate: [0.88, 0.89, 0.89, 0.9, 0.9, 0.91, 0.91, 0.84, 0.8, 0.76, 0.72, 0.68, 0.64, 0.6]
  }
];

export const feedbackRows: FeedbackRow[] = dates.flatMap((date, index) =>
  feedbackProfiles.map((profile) => {
    const count = profile.counts[index];

    return {
      date,
      source: profile.source,
      issueType: profile.issueType,
      sentiment: profile.sentiment,
      count,
      averageProcessHours: profile.hours[index],
      averageSatisfaction: profile.satisfaction[index],
      resolvedCount: Math.round(count * profile.resolvedRate[index])
    };
  })
);

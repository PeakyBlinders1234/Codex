import type { AIProvider, ScenarioAnalysis } from "@/types";

export class MockAIProvider implements AIProvider {
  name = "MockAIProvider";

  async generateInsightSummary(input: ScenarioAnalysis): Promise<string> {
    const riskMetrics = input.metrics.filter((metric) => metric.status !== "normal");
    const topRisk = riskMetrics[0];

    if (input.scenario.id === "operations") {
      return `AI 判断当前经营面整体仍在增长，但${topRisk?.name ?? "局部履约"}出现压力。建议把分析重点放在校区差异、骑手成本和客诉链路，而不是只看订单总量。`;
    }

    if (input.scenario.id === "conversion") {
      return `AI 判断当前增长入口规模扩大，但部分渠道成交效率承压。建议将预算从低转化高 CAC 渠道迁移到高意向渠道，并同步优化试用后的付费承接。`;
    }

    return `AI 判断用户反馈的主要矛盾集中在高频负向问题和处理时长。建议把反馈聚类结果转化为产品需求优先级，并用满意度和未解决问题数跟踪改版效果。`;
  }

  async generateReportAdvice(input: ScenarioAnalysis): Promise<string[]> {
    if (input.scenario.id === "operations") {
      return [
        "先处理高成本且高客诉校区，避免增长被履约体验抵消。",
        "把订单增长、骑手供给和商家出餐 SLA 放到同一张周报中复盘。",
        "对履约风险区域设置未来 7 天的成本率和客诉率预警线。"
      ];
    }

    if (input.scenario.id === "conversion") {
      return [
        "将渠道预算按成交转化率和 CAC 分层管理，低效渠道先降预算再做素材 AB 测试。",
        "把漏斗损耗最大的环节作为增长实验入口，而不是平均优化每个环节。",
        "沉淀高转化渠道画像，反向指导内容选题和落地页卖点。"
      ];
    }

    return [
      "把配送时效、优惠券不可用等高频负向问题拆成产品需求和运营动作。",
      "对超过 9 小时的反馈建立升级机制，优先保护满意度。",
      "用负向反馈占比、平均处理时长和未解决数作为改版后的验收指标。"
    ];
  }
}

export const mockAIProvider = new MockAIProvider();

export const aiProviderIntegrationNote = `
AIProvider 目前由 MockAIProvider 实现，保证面试演示稳定。
后续接入真实大模型时，可以新增 OpenAIProvider 或 ClaudeProvider：
1. 保持 generateInsightSummary 和 generateReportAdvice 的入参不变。
2. 将 ScenarioAnalysis 中的指标、异常和图表摘要序列化为 prompt。
3. 在服务端 Route Handler 中读取 API Key，避免在浏览器暴露密钥。
4. 保留 MockAIProvider 作为离线演示和单元测试兜底。
`;

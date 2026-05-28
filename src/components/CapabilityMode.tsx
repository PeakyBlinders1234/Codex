"use client";

import { useState } from "react";
import { BrainCircuit, ChevronDown, DatabaseZap, FileQuestion, FileText, Gauge, RadioTower, Sparkles } from "lucide-react";

export function CapabilityMode() {
  const [open, setOpen] = useState(true);

  const capabilities = [
    { title: "数据输入", detail: "三套运营场景 mock 数据，保证公开演示稳定。", icon: DatabaseZap },
    { title: "补充询问", detail: "缺少校区 ID 或时间范围时先反问，再查数。", icon: FileQuestion },
    { title: "指标建模", detail: "KPI、环比、转化率、成本率、满意度和 SQL 口径。", icon: Gauge },
    { title: "AI 洞察", detail: "规则异常识别 + Mock AI 解释原因和证据。", icon: BrainCircuit },
    { title: "报告生成", detail: "自动生成结构化经营分析报告。", icon: FileText },
    { title: "行动闭环", detail: "把洞察转成负责人、优先级、验收影响。", icon: RadioTower }
  ];

  return (
    <section className="dashboard-panel rounded-lg p-4">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
          <span>
            <span className="block text-sm font-semibold text-ink">AI 能力展示</span>
            <span className="block text-xs text-muted">展示 AI 如何把数据分析产品化</span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open ? (
        <div className="mt-4 space-y-4 border-t border-line pt-4 text-xs leading-6 text-muted">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {capabilities.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="rounded-lg border border-line bg-[rgba(var(--panel-rgb),0.48)] p-3">
                  <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
                  <p className="mt-2 font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 leading-5 text-muted">{item.detail}</p>
                </div>
              );
            })}
          </div>
          <Block title="这个 Demo 展示的能力">
            DataOps Copilot 展示的是把 AI 嵌入运营分析流程的能力：不是让用户对着机器人提问，而是让系统自动补齐查询条件、组织指标、识别异常、解释原因、生成报告，并给出可执行行动。
          </Block>
          <Block title="为什么使用 Mock AI">
            当前使用本地 MockAIProvider，目的是让公开展示稳定、可离线运行、不会被 API Key 或网络状态影响。代码结构保留 AIProvider 抽象，后续可以替换为 OpenAI、Claude 或企业内部模型。
          </Block>
          <Block title="产品化亮点">
            三个场景覆盖经营、转化和用户反馈；问数模块演示 Slot Filling；业务星图把指标、预警和行动关系可视化；报告区展示 AI 生成结果；行动看板把洞察变成负责人、优先级和验收影响。
          </Block>
          <div className="rounded-lg border border-accent bg-[rgba(var(--accent-rgb),0.10)] p-3">
            <p className="font-semibold text-ink">对外展示说明</p>
            <p className="mt-2">
              这个网站展示的是一个 AI 数据运营指挥舱：选择不同业务场景后，系统会自动计算指标、发现风险、解释异常、生成经营报告，并把建议转成行动任务；问数模块还展示了缺少校区 ID 和时间范围时的补充询问机制。它的重点是展示 AI 能力如何落到真实业务流程里，而不是只做一个聊天窗口。
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

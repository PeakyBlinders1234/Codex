"use client";

import { useState } from "react";
import { ChevronDown, Presentation } from "lucide-react";

export function InterviewMode() {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-lg border border-line bg-white p-4 shadow-panel">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="flex items-center gap-2">
          <Presentation className="h-5 w-5 text-accent" aria-hidden="true" />
          <span>
            <span className="block text-sm font-semibold text-ink">面试讲解模式</span>
            <span className="block text-xs text-muted">打开后可按 1 分钟话术介绍项目</span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open ? (
        <div className="mt-4 space-y-4 border-t border-line pt-4 text-xs leading-6 text-slate-700">
          <Block title="项目背景">
            运营团队经常需要重复查数、做报表、找异常、写周报，很多时间花在机械整理上，真正用于判断问题和推动动作的时间不够。
          </Block>
          <Block title="我解决的问题">
            我把数据分析流程产品化：先选业务场景，再看指标、图表、异常解释，最后由 AI 辅助生成结构化经营分析报告。
          </Block>
          <Block title="我的技术点">
            Next.js、TypeScript、Tailwind CSS、Recharts、指标体系计算、异常识别规则、AIProvider 抽象和 MockAIProvider 稳定演示。
          </Block>
          <Block title="我的业务点">
            覆盖经营分析、转化分析和用户反馈分析，强调指标口径、维度拆解、异常归因、运营建议和需求优先级。
          </Block>
          <div className="rounded-lg bg-teal-50 p-3">
            <p className="font-semibold text-ink">1 分钟介绍稿</p>
            <p className="mt-2">
              这个项目叫 DataOps Copilot，是我为数据分析、数据运营和产品运营岗位准备的 AI 数据运营分析工作台。它不是普通聊天机器人，而是把运营分析流程做成一个可演示的产品闭环：选择场景后，系统会基于本地 mock 数据计算 KPI、趋势、维度对比和异常规则，再用 Mock AI 生成洞察解释和结构化报告。三个场景分别对应经营分析、转化分析和用户反馈，能展示我对指标口径、SQL 思维、异常识别、图表表达和运营决策落地的理解。技术上我用了 Next.js、TypeScript、Tailwind、Recharts，并抽象了 AIProvider，后续可以替换为 OpenAI 或 Claude API。
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

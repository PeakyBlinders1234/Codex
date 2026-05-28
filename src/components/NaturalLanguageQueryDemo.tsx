"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clipboard,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  Play,
  RotateCcw,
  Search,
  Table2,
  UserRound
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatNumber, formatRateChange } from "@/lib/format";
import { extractOrderQuerySlots, queryRowsToTsv, runOrderQuery } from "@/lib/slot-filling-query";
import type { OrderQueryResult, QuerySlotName, SlotExtraction } from "@/types";

const firstPrompt = "我要查潍坊工程上周单量";
const secondPrompt = "校区ID：123，2026-05-13-2026-05-19单量";

type DemoMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const introMessage: DemoMessage = {
  id: "intro",
  role: "assistant",
  text: "我是自然语言问数演示机器人。业务员可以用口语提问，我会先检查校区ID、时间范围和指标是否齐全。"
};

const completedMessages: DemoMessage[] = [
  introMessage,
  { id: "u1", role: "user", text: firstPrompt },
  { id: "a1", role: "assistant", text: "请提供具体校区ID和时间范围。" },
  { id: "u2", role: "user", text: secondPrompt },
  {
    id: "a2",
    role: "assistant",
    text: "槽位已补齐，已查询 mock_order_daily，并生成潍坊工程职业技术学院（南小区）上周单量看板和 Excel 表格。"
  }
];

const missingSlotLabel: Record<QuerySlotName, string> = {
  campusId: "校区ID",
  dateRange: "时间范围",
  metric: "查询指标"
};

function tooltipFormatter(value: unknown, name: unknown): [string, string] {
  return [typeof value === "number" ? formatNumber(value) : String(value ?? "-"), String(name ?? "")];
}

function buildAssistantReply(slots: SlotExtraction, result: OrderQueryResult | null) {
  if (slots.status === "needs_clarification") return slots.clarification;
  if (!result) return "槽位已补齐，但当前 mock 数据集中没有匹配记录。";

  return `已查询 ${result.campusName} ${result.startDate} 至 ${result.endDate} 的单量，总计 ${formatNumber(result.totalOrders)} 单，日均 ${formatNumber(result.averageDailyOrders)} 单。`;
}

function SlotPill({ label, value, ready }: { label: string; value: string; ready: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${ready ? "border-teal-300/35 bg-teal-300/10" : "border-amber-300/40 bg-amber-300/10"}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${ready ? "text-accent" : "text-warning"}`}>{value}</p>
    </div>
  );
}

function ResultMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-line bg-[rgba(var(--panel-rgb),0.50)] p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

export function NaturalLanguageQueryDemo() {
  const defaultSlots = useMemo(() => extractOrderQuerySlots(secondPrompt), []);
  const defaultResult = useMemo(() => runOrderQuery(defaultSlots), [defaultSlots]);
  const [input, setInput] = useState(secondPrompt);
  const [messages, setMessages] = useState<DemoMessage[]>(completedMessages);
  const [slots, setSlots] = useState<SlotExtraction>(defaultSlots);
  const [result, setResult] = useState<OrderQueryResult | null>(defaultResult);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function applyQuery(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;

    const nextSlots = extractOrderQuerySlots(trimmed);
    const nextResult = runOrderQuery(nextSlots);
    const reply = buildAssistantReply(nextSlots, nextResult);

    setMessages((current) => [
      ...current,
      { id: `u-${current.length}-${trimmed}`, role: "user", text: trimmed },
      { id: `a-${current.length}-${reply}`, role: "assistant", text: reply }
    ]);
    setSlots(nextSlots);
    setResult(nextResult);
    setInput(nextSlots.status === "needs_clarification" ? secondPrompt : "");
  }

  function replayMissingStep() {
    const nextSlots = extractOrderQuerySlots(firstPrompt);
    setMessages([introMessage, { id: "u1-replay", role: "user", text: firstPrompt }, { id: "a1-replay", role: "assistant", text: nextSlots.clarification }]);
    setSlots(nextSlots);
    setResult(null);
    setInput(secondPrompt);
    setCopied(false);
  }

  function replayCompletedFlow() {
    setMessages(completedMessages);
    setSlots(defaultSlots);
    setResult(defaultResult);
    setInput(secondPrompt);
    setCopied(false);
  }

  async function copyExcelTable() {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(queryRowsToTsv(result));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const missingText = slots.missingSlots.length ? slots.missingSlots.map((slot) => missingSlotLabel[slot]).join("、") : "无缺失";

  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
      <div className="min-w-0 space-y-4">
        <section className="dashboard-panel rounded-lg p-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Search className="h-4 w-4 text-accent" aria-hidden="true" />
                自然语言问数演示
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted">演示 Aily 数据查询机器人里的补充询问机制：缺少校区 ID 或明确日期时，先反问，再查数。</p>
            </div>
            <span className="rounded-full border border-accent bg-[rgba(var(--accent-rgb),0.10)] px-3 py-1 text-xs text-accent">Slot Filling</span>
          </div>

          <div className="space-y-3">
            {messages.map((message) => {
              const isUser = message.role === "user";
              const Icon = isUser ? UserRound : Bot;

              return (
                <div key={message.id} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser ? (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(var(--accent-rgb),0.14)] text-accent">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : null}
                  <div
                    className={`max-w-[82%] rounded-lg border px-3 py-2 text-sm leading-6 ${
                      isUser ? "border-accent bg-[rgba(var(--accent-rgb),0.16)] text-ink" : "border-line bg-[rgba(var(--panel-rgb),0.58)] text-muted"
                    }`}
                  >
                    {message.text}
                  </div>
                  {isUser ? (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-[rgba(var(--panel-rgb),0.58)] text-muted">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <form
            className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              applyQuery(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-h-11 rounded-lg border border-line bg-[rgba(var(--panel-rgb),0.62)] px-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent"
              placeholder="输入：校区ID：123，2026-05-13-2026-05-19单量"
            />
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              <Play className="h-4 w-4" aria-hidden="true" />
              运行问数
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={replayMissingStep} className="rounded-lg border border-line px-3 py-2 text-xs text-muted transition hover:border-accent hover:text-accent">
              发送缺失信息问题
            </button>
            <button type="button" onClick={replayCompletedFlow} className="rounded-lg border border-line px-3 py-2 text-xs text-muted transition hover:border-accent hover:text-accent">
              补齐槽位并显示结果
            </button>
            <button
              type="button"
              onClick={() => {
                setMessages([introMessage]);
                setSlots(extractOrderQuerySlots(""));
                setResult(null);
                setInput(firstPrompt);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-muted transition hover:border-accent hover:text-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              重置
            </button>
          </div>
        </section>

        <section className="dashboard-panel rounded-lg p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Database className="h-4 w-4 text-accent" aria-hidden="true" />
                槽位识别状态
              </h2>
              <p className="mt-1 text-xs text-muted">校区名称和“上周”会被识别，但查询必须补齐校区 ID 和明确日期范围。</p>
            </div>
            <span className={`rounded-full border px-2 py-1 text-xs ${slots.status === "ready" ? "border-teal-300/40 bg-teal-300/10 text-accent" : "border-amber-300/40 bg-amber-300/10 text-warning"}`}>
              {slots.status === "ready" ? "可执行" : "需要补充"}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <SlotPill label="校区名称" value={slots.campusName ?? "待识别"} ready={Boolean(slots.campusName)} />
            <SlotPill label="校区ID" value={slots.campusId ?? "缺失"} ready={Boolean(slots.campusId)} />
            <SlotPill label="时间范围" value={slots.startDate && slots.endDate ? `${slots.startDate} 至 ${slots.endDate}` : slots.relativeTime ?? "缺失"} ready={Boolean(slots.startDate && slots.endDate)} />
            <SlotPill label="查询指标" value={slots.metric ?? "缺失"} ready={Boolean(slots.metric)} />
          </div>
          <div className="mt-3 rounded-lg border border-line bg-[rgba(var(--panel-rgb),0.55)] p-3 text-xs leading-5 text-muted">
            <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-warning" aria-hidden="true" />
            当前缺失槽位：{missingText}。触发规则：校区只给简称、时间只说“上周”时，不直接查数，先反问以避免查错。
          </div>
        </section>
      </div>

      <div className="min-w-0 space-y-4">
        <section className="dashboard-panel rounded-lg p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ClipboardCheck className="h-4 w-4 text-accent" aria-hidden="true" />
                查询结果看板
              </h2>
              <p className="mt-1 text-xs text-muted">{result ? `${result.campusName} · ${result.startDate} 至 ${result.endDate}` : "补齐槽位后展示结果"}</p>
            </div>
            <span className="rounded-full border border-line px-2 py-1 text-xs text-muted">mock_order_daily</span>
          </div>

          {result ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ResultMetric label="总单量" value={`${formatNumber(result.totalOrders)} 单`} detail={`环比 ${formatRateChange(result.changeRate)}`} />
                <ResultMetric label="日均单量" value={`${formatNumber(result.averageDailyOrders)} 单`} detail="按 7 天平均" />
                <ResultMetric label="峰值日期" value={result.peakDate.slice(5)} detail={`${formatNumber(result.peakDateOrders)} 单`} />
                <ResultMetric label="校区ID" value={result.campusId} detail="潍坊工程南小区" />
              </div>

              <div className="h-[260px] min-w-0 rounded-lg border border-line bg-[rgba(var(--panel-rgb),0.35)] p-3">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                      <CartesianGrid stroke="var(--line)" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(value) => String(value).slice(5)} tick={{ fontSize: 12, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} tickLine={false} axisLine={false} width={48} />
                      <Tooltip formatter={tooltipFormatter} contentStyle={{ borderColor: "var(--line)", borderRadius: 8, background: "var(--panel)", color: "var(--ink)" }} />
                      <Bar dataKey="orderCount" name="单量" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted">图表加载中...</div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-line bg-[rgba(var(--panel-rgb),0.35)] p-6 text-center text-sm leading-6 text-muted">
              先发送“我要查潍坊工程上周单量”，机器人会要求补充校区 ID 和时间范围。
            </div>
          )}
        </section>

        <section className="dashboard-panel rounded-lg p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <FileSpreadsheet className="h-4 w-4 text-accent" aria-hidden="true" />
                Excel 表格结果
              </h2>
              <p className="mt-1 text-xs text-muted">以业务员熟悉的明细表方式返回查询结果。</p>
            </div>
            <button
              type="button"
              onClick={copyExcelTable}
              disabled={!result}
              className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-muted transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />}
              {copied ? "已复制" : "复制 Excel 表格"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="min-w-[780px] w-full border-collapse text-left text-xs">
              <thead className="bg-[rgba(var(--panel-rgb),0.72)] text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">日期</th>
                  <th className="px-3 py-2 font-medium">校区ID</th>
                  <th className="px-3 py-2 font-medium">校区名称</th>
                  <th className="px-3 py-2 text-right font-medium">单量</th>
                  <th className="px-3 py-2 text-right font-medium">上周同期</th>
                  <th className="px-3 py-2 font-medium">高峰时段</th>
                </tr>
              </thead>
              <tbody>
                {result ? (
                  result.rows.map((row) => (
                    <tr key={row.date} className="border-t border-line text-muted">
                      <td className="px-3 py-2 text-ink">{row.date}</td>
                      <td className="px-3 py-2">{row.campusId}</td>
                      <td className="px-3 py-2">{row.campusName}</td>
                      <td className="px-3 py-2 text-right font-semibold text-ink">{formatNumber(row.orderCount)}</td>
                      <td className="px-3 py-2 text-right">{formatNumber(row.previousWeekOrderCount)}</td>
                      <td className="px-3 py-2">{row.peakHour}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-line text-muted">
                    <td className="px-3 py-6 text-center" colSpan={6}>
                      暂无结果，等待补齐槽位。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-[rgba(var(--panel-rgb),0.48)] p-3 text-xs leading-5 text-muted">
            <Table2 className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            返回字段：date、campus_id、campus_name、order_count、previous_week_order_count、peak_hour。
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="dashboard-chip rounded-lg p-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-ink">
              <CalendarDays className="h-4 w-4 text-accent" aria-hidden="true" />
              示例 SQL
            </p>
            <pre className="mt-2 rounded-md border border-line bg-slate-950 p-3 text-[11px] leading-5 text-slate-100">{`SELECT date, campus_id, campus_name, order_count
FROM mock_order_daily
WHERE campus_id = '123'
  AND date BETWEEN '2026-05-13' AND '2026-05-19'
ORDER BY date;`}</pre>
          </div>
          <div className="dashboard-chip rounded-lg p-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-ink">
              <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden="true" />
              演示价值
            </p>
            <p className="mt-2 text-xs leading-6 text-muted">
              这个模块展示的是 AI 问数的产品化能力：先做意图识别和槽位校验，再通过补充询问降低查错概率，最后返回业务可用的看板和明细表。
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}

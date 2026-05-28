"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ChartSeries } from "@/types";

function formatTooltip(value: unknown, name: unknown): [string, string] {
  const formattedValue = typeof value === "number" ? value.toLocaleString("zh-CN") : String(value ?? "-");
  return [formattedValue, String(name ?? "")];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getCategoryAxisWidth(chart: ChartSeries) {
  const longestLabel = chart.data.reduce((longest, item) => {
    const label = String(item[chart.xKey] ?? "");
    return Array.from(label).length > Array.from(longest).length ? label : longest;
  }, "");
  const minimumWidth = chart.kind === "ranking" ? 72 : 56;
  const estimatedWidth = Array.from(longestLabel).length * 14 + 24;

  return clamp(estimatedWidth, minimumWidth, 112);
}

function ChartShell({
  chart,
  children,
  highlighted = false
}: {
  chart: ChartSeries;
  children: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <section className={`dashboard-panel min-w-0 rounded-lg p-4 transition ${highlighted ? "border-accent bg-[rgba(var(--accent-rgb),0.10)]" : ""}`}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-ink">{chart.title}</h2>
        <p className="mt-1 text-xs leading-5 text-muted">{chart.description}</p>
      </div>
      <div className="h-[300px] min-w-0">{children}</div>
    </section>
  );
}

function ChartPlaceholder({ chart, highlighted }: { chart: ChartSeries; highlighted?: boolean }) {
  return (
    <ChartShell chart={chart} highlighted={highlighted}>
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-line bg-surface text-xs text-muted">
        图表加载中...
      </div>
    </ChartShell>
  );
}

function LineChartPanel({ chart, highlighted }: { chart: ChartSeries; highlighted?: boolean }) {
  return (
    <ChartShell chart={chart} highlighted={highlighted}>
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <LineChart data={chart.data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey={chart.xKey} tick={{ fontSize: 12, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} tickLine={false} axisLine={false} width={48} />
          <Tooltip formatter={formatTooltip} contentStyle={{ borderColor: "var(--line)", borderRadius: 8, background: "var(--panel)", color: "var(--ink)" }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "var(--muted)" }} />
          {chart.yKeys.map((key) => (
            <Line
              key={key.key}
              type="monotone"
              dataKey={key.key}
              name={key.name}
              stroke={key.color}
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function BarChartPanel({ chart, highlighted }: { chart: ChartSeries; highlighted?: boolean }) {
  return (
    <ChartShell chart={chart} highlighted={highlighted}>
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <BarChart data={chart.data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey={chart.xKey} tick={{ fontSize: 12, fill: "var(--muted)" }} tickLine={false} axisLine={false} interval={0} />
          <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} tickLine={false} axisLine={false} width={48} />
          <Tooltip formatter={formatTooltip} contentStyle={{ borderColor: "var(--line)", borderRadius: 8, background: "var(--panel)", color: "var(--ink)" }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "var(--muted)" }} />
          {chart.yKeys.map((key) => (
            <Bar key={key.key} dataKey={key.key} name={key.name} fill={key.color} radius={[6, 6, 0, 0]} maxBarSize={48} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function HorizontalBarChartPanel({ chart, highlighted }: { chart: ChartSeries; highlighted?: boolean }) {
  const categoryAxisWidth = getCategoryAxisWidth(chart);

  return (
    <ChartShell chart={chart} highlighted={highlighted}>
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <BarChart data={chart.data} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="var(--line)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: "var(--muted)" }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey={chart.xKey}
            tick={{ fontSize: 12, fill: "var(--ink)" }}
            tickMargin={8}
            tickLine={false}
            axisLine={false}
            interval={0}
            width={categoryAxisWidth}
          />
          <Tooltip formatter={formatTooltip} contentStyle={{ borderColor: "var(--line)", borderRadius: 8, background: "var(--panel)", color: "var(--ink)" }} />
          <Bar dataKey={chart.yKeys[0].key} name={chart.yKeys[0].name} fill={chart.yKeys[0].color} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function chartMatchesMetric(chart: ChartSeries, selectedMetricName?: string | null) {
  if (!selectedMetricName) return false;
  return chart.title.includes(selectedMetricName) || chart.yKeys.some((key) => key.name.includes(selectedMetricName) || selectedMetricName.includes(key.name));
}

export function ChartPanels({ charts, selectedMetricName }: { charts: ChartSeries[]; selectedMetricName?: string | null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="grid min-w-0 gap-3 xl:grid-cols-2">
        {charts.map((chart) => (
          <ChartPlaceholder key={chart.id} chart={chart} highlighted={chartMatchesMetric(chart, selectedMetricName)} />
        ))}
      </section>
    );
  }

  return (
    <section className="grid min-w-0 gap-3 xl:grid-cols-2">
      {charts.map((chart) => {
        const highlighted = chartMatchesMetric(chart, selectedMetricName);

        if (chart.kind === "line") return <LineChartPanel key={chart.id} chart={chart} highlighted={highlighted} />;
        if (chart.kind === "funnel" || chart.kind === "ranking") return <HorizontalBarChartPanel key={chart.id} chart={chart} highlighted={highlighted} />;
        return <BarChartPanel key={chart.id} chart={chart} highlighted={highlighted} />;
      })}
    </section>
  );
}

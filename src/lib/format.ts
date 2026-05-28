import type { MetricStatus } from "@/types";

export function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(Math.round(value));
}

export function formatCurrency(value: number) {
  if (Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(1)} 万`;
  }

  return `¥${formatNumber(value)}`;
}

export function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatRateChange(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

export function changeRate(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 1;
  }

  return (current - previous) / previous;
}

export function statusLabel(status: MetricStatus) {
  const labels: Record<MetricStatus, string> = {
    normal: "正常",
    watch: "关注",
    risk: "风险"
  };

  return labels[status];
}

export function statusClass(status: MetricStatus) {
  const classes: Record<MetricStatus, string> = {
    normal: "border-emerald-400/35 bg-emerald-400/10 text-success",
    watch: "border-amber-400/35 bg-amber-400/10 text-warning",
    risk: "border-rose-400/35 bg-rose-400/10 text-danger"
  };

  return classes[status];
}

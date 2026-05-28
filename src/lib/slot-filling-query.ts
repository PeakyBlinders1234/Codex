import { campusDirectory, orderQueryRows } from "@/data/natural-language-query";
import type { OrderQueryResult, QuerySlotName, SlotExtraction } from "@/types";

const campusIdPattern = /校区\s*ID\s*[:：]?\s*(\d+)/i;
const dateRangePattern = /(\d{4}-\d{2}-\d{2})\s*(?:至|到|~|—|-)\s*(\d{4}-\d{2}-\d{2})/;

function findCampusName(input: string) {
  return campusDirectory.find((item) => item.aliases.some((alias) => input.includes(alias)))?.campusName;
}

function findCampusById(campusId?: string) {
  if (!campusId) return undefined;
  return campusDirectory.find((item) => item.campusId === campusId);
}

export function extractOrderQuerySlots(input: string): SlotExtraction {
  const campusId = input.match(campusIdPattern)?.[1];
  const dateRange = input.match(dateRangePattern);
  const campus = findCampusById(campusId);
  const campusName = campus?.campusName ?? findCampusName(input);
  const metric = input.includes("单量") || input.includes("订单") ? "单量" : undefined;
  const relativeTime = input.includes("上周") ? "上周" : undefined;
  const missingSlots: QuerySlotName[] = [];

  if (!campusId) missingSlots.push("campusId");
  if (!dateRange) missingSlots.push("dateRange");
  if (!metric) missingSlots.push("metric");

  return {
    campusName,
    campusId,
    startDate: dateRange?.[1],
    endDate: dateRange?.[2],
    metric,
    relativeTime,
    missingSlots,
    status: missingSlots.length ? "needs_clarification" : "ready",
    clarification: missingSlots.length ? "请提供具体校区ID和时间范围。" : "槽位已补齐，可以执行查询。"
  };
}

export function runOrderQuery(slots: SlotExtraction): OrderQueryResult | null {
  if (slots.status !== "ready" || !slots.campusId || !slots.startDate || !slots.endDate) return null;

  const rows = orderQueryRows.filter((row) => row.campusId === slots.campusId && row.date >= slots.startDate! && row.date <= slots.endDate!);
  if (!rows.length) return null;

  const totalOrders = rows.reduce((total, row) => total + row.orderCount, 0);
  const previousTotalOrders = rows.reduce((total, row) => total + row.previousWeekOrderCount, 0);
  const peakRow = rows.reduce((peak, row) => (row.orderCount > peak.orderCount ? row : peak), rows[0]);

  return {
    campusId: slots.campusId,
    campusName: rows[0].campusName,
    startDate: slots.startDate,
    endDate: slots.endDate,
    totalOrders,
    previousTotalOrders,
    changeRate: previousTotalOrders ? (totalOrders - previousTotalOrders) / previousTotalOrders : 0,
    averageDailyOrders: Math.round(totalOrders / rows.length),
    peakDate: peakRow.date,
    peakDateOrders: peakRow.orderCount,
    rows
  };
}

export function queryRowsToTsv(result: OrderQueryResult) {
  const header = ["日期", "校区ID", "校区名称", "单量", "上周同期单量", "高峰时段"];
  const rows = result.rows.map((row) => [
    row.date,
    row.campusId,
    row.campusName,
    String(row.orderCount),
    String(row.previousWeekOrderCount),
    row.peakHour
  ]);

  return [header, ...rows].map((row) => row.join("\t")).join("\n");
}

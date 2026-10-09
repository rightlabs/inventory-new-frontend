// Pure helpers for the MIS UI. No React here, so a plain script can test them
// (scripts/test-mis-ui.ts). They only group and add up numbers the API sent;
// they never change a figure.

import { addDays, format, parse } from "date-fns";
import { round2 } from "@/utils/format";

// ------------------------------------------------------------ day groups
export interface DayRowLike {
  date: string | Date;
  direction: "in" | "out";
  amount: number;
}

export interface DayGroup<T extends DayRowLike = DayRowLike> {
  /** yyyy-MM-dd in the browser's time zone (India for this shop). */
  key: string;
  /** Local midnight of that day. */
  date: Date;
  rows: T[];
  in: number;
  out: number;
  /** in − out */
  net: number;
  count: number;
}

export const dayKey = (d: string | Date) => format(new Date(d), "yyyy-MM-dd");
export const dayFromKey = (key: string) => parse(key, "yyyy-MM-dd", new Date());

/**
 * Group cash-book rows by calendar day, keeping the order the rows came in
 * (the API sends newest first, so groups are newest first too). Each group
 * has its own money in / out / net, rounded to paise.
 */
export function groupRowsByDay<T extends DayRowLike>(rows: T[]): DayGroup<T>[] {
  const map = new Map<string, DayGroup<T>>();
  for (const r of rows) {
    const key = dayKey(r.date);
    let g = map.get(key);
    if (!g) {
      g = { key, date: dayFromKey(key), rows: [], in: 0, out: 0, net: 0, count: 0 };
      map.set(key, g);
    }
    g.rows.push(r);
    g.count += 1;
    if (r.direction === "in") g.in += Number(r.amount) || 0;
    else g.out += Number(r.amount) || 0;
  }
  return Array.from(map.values()).map((g) => {
    const i = round2(g.in);
    const o = round2(g.out);
    return { ...g, in: i, out: o, net: round2(i - o) };
  });
}

// ------------------------------------------------------------ chart series
export interface DailyInOutPoint {
  /** yyyy-MM-dd */
  date: string;
  in: number;
  out: number;
}

/**
 * Day-by-day money in / out for a chart. With startDate + endDate (yyyy-MM-dd)
 * every day in the range is present (0 on quiet days), oldest first, so the
 * chart's x-axis has no gaps.
 */
export function dailyInOutSeries(
  groups: Pick<DayGroup, "key" | "in" | "out">[],
  range?: { startDate: string; endDate: string }
): DailyInOutPoint[] {
  const byKey = new Map(groups.map((g) => [g.key, g]));
  if (!range) {
    return [...groups]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((g) => ({ date: g.key, in: g.in, out: g.out }));
  }
  const out: DailyInOutPoint[] = [];
  const end = dayFromKey(range.endDate);
  for (let d = dayFromKey(range.startDate); d <= end; d = addDays(d, 1)) {
    const key = format(d, "yyyy-MM-dd");
    const g = byKey.get(key);
    out.push({ date: key, in: g?.in ?? 0, out: g?.out ?? 0 });
  }
  return out;
}

// ------------------------------------------------------------ row type
export type CashRowType =
  | "sale"
  | "receipt"
  | "advance"
  | "vendor"
  | "purchase"
  | "freight"
  | "refund"
  | "other";

/** Which TypeTag a cash-book row gets (from the API's documentRef / kind). */
export function cashRowType(r: { documentRef?: string; kind?: string }): CashRowType {
  if (r.documentRef === "Freight") return "freight";
  if (r.kind?.startsWith("Refund")) return "refund";
  switch (r.documentRef) {
    case "Sale":
      return "sale";
    case "Receipt":
      return "receipt";
    case "Advance":
      return "advance";
    case "Purchase":
      return "purchase";
    case "Payment":
      return "vendor";
    default:
      return "other";
  }
}

// ------------------------------------------------------------ customer profit
export interface ProfitRowLike {
  name: string;
  code?: string;
  profit: number;
  margin: number | null;
  sales?: number;
  bills?: number;
}

export interface CustomerHighlights<T extends ProfitRowLike> {
  /** Highest profit (only when it is above 0). */
  top: T | null;
  losers: {
    count: number;
    /** Sum of the losses, a negative number (or 0). */
    total: number;
    /** The customer with the biggest loss. */
    worst: T | null;
  };
}

export function customerHighlights<T extends ProfitRowLike>(rows: T[]): CustomerHighlights<T> {
  let top: T | null = null;
  let worst: T | null = null;
  let count = 0;
  let total = 0;
  for (const r of rows) {
    if (r.profit > 0 && (!top || r.profit > top.profit)) top = r;
    if (r.profit < 0) {
      count += 1;
      total += r.profit;
      if (!worst || r.profit < worst.profit) worst = r;
    }
  }
  return { top, losers: { count, total: round2(total), worst } };
}

// ------------------------------------------------------------ mode split
export type PayMode = "cash" | "online" | "cheque" | "other";
export const MODE_ORDER: PayMode[] = ["cash", "online", "cheque", "other"];

export interface ModeSplitLike {
  cash: number;
  online: number;
  cheque: number;
  other: number;
}

/** Non-zero modes in display order, with each one's share of the positive total. */
export function modeParts(s: ModeSplitLike) {
  const parts = MODE_ORDER.map((mode) => ({ mode, value: round2(s[mode]) })).filter(
    (p) => p.value !== 0
  );
  const allPositive = parts.every((p) => p.value > 0);
  const total = parts.reduce((a, p) => a + (p.value > 0 ? p.value : 0), 0);
  return {
    parts: parts.map((p) => ({ ...p, share: allPositive && total > 0 ? p.value / total : 0 })),
    allPositive,
    total: round2(total),
  };
}

"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatINRShort, formatINRSmart } from "@/utils/formatSmart";
import { dayFromKey, type DailyInOutPoint } from "./helpers";
import { SignedAmount } from "./SignedAmount";

// Same green / red as the amounts. Red vs green alone is weak for colour-blind
// readers (deutan ΔE 5.8), so direction is ALSO position: in goes up, out
// goes down from the zero line.
const IN = "#059669"; // emerald-600
const OUT = "#E11D48"; // rose-600

export interface DailyInOutChartProps {
  /** One point per day, oldest first (see dailyInOutSeries). */
  data: DailyInOutPoint[];
  height?: number;
  loading?: boolean;
  className?: string;
}

// Round the axis end up to 1 / 2 / 2.5 / 5 x 10^n so halves stay readable (₹2.5L, ₹5L).
const niceMax = (v: number) => {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * p >= v) ?? 10;
  return step * p;
};

type Row = { date: string; in: number; outNeg: number; out: number };

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload as Row;
  const net = r.in - r.out;
  return (
    <div className="min-w-[180px] rounded-lg border border-slate-200 bg-white p-3 text-[13px] shadow-lg">
      <p className="mb-2 font-semibold text-slate-900">{format(dayFromKey(r.date), "EEE, d MMM yyyy")}</p>
      <dl className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <dt className="flex items-center gap-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: IN }} aria-hidden />
            Money in
          </dt>
          <dd className="font-medium tabular-nums text-slate-900">{formatINRSmart(r.in)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="flex items-center gap-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: OUT }} aria-hidden />
            Money out
          </dt>
          <dd className="font-medium tabular-nums text-slate-900">{formatINRSmart(r.out)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-1">
          <dt className="text-slate-600">Net</dt>
          <dd>
            <SignedAmount value={net} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Money in vs money out per day. In = green bars above the line, out = red
 * bars below it. Y-axis in short Indian units (₹45K, ₹3.5L, ₹1.2Cr); the
 * tooltip shows full amounts.
 */
export function DailyInOutChart({ data, height = 280, loading = false, className }: DailyInOutChartProps) {
  const rows: Row[] = useMemo(
    () => data.map((d) => ({ date: d.date, in: d.in, out: d.out, outNeg: -d.out })),
    [data]
  );
  const totals = useMemo(
    () => rows.reduce((a, r) => ({ in: a.in + r.in, out: a.out + r.out }), { in: 0, out: 0 }),
    [rows]
  );
  const empty = !loading && rows.every((r) => r.in === 0 && r.out === 0);
  // Symmetric scale so "up" and "down" bars compare by eye.
  const max = niceMax(Math.max(1, ...rows.map((r) => Math.max(r.in, r.out))));
  const ticks = [-max, -max / 2, 0, max / 2, max];

  return (
    <div className={cn("min-w-0", className)}>
      {/* Legend with totals: identity is never colour alone. */}
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px]" aria-label="Legend">
        <li className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: IN }} aria-hidden />
          <span className="text-slate-600">Money in (bars up)</span>
          {!loading && !empty && <span className="font-medium tabular-nums text-slate-900">{formatINRSmart(totals.in)}</span>}
        </li>
        <li className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: OUT }} aria-hidden />
          <span className="text-slate-600">Money out (bars down)</span>
          {!loading && !empty && <span className="font-medium tabular-nums text-slate-900">{formatINRSmart(totals.out)}</span>}
        </li>
      </ul>

      <div style={{ height }} className="relative">
        {loading ? (
          <div className="flex h-full items-center gap-[3%] px-12" aria-hidden>
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="flex h-full flex-1 flex-col justify-center">
                <div className="animate-pulse rounded-t bg-slate-100" style={{ height: `${18 + ((i * 37) % 30)}%` }} />
                <div className="h-px bg-slate-200" />
                <div className="animate-pulse rounded-b bg-slate-100" style={{ height: `${10 + ((i * 23) % 22)}%` }} />
              </div>
            ))}
          </div>
        ) : empty ? (
          <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 px-6 text-center">
            <BarChart3 className="h-6 w-6 text-slate-300" aria-hidden />
            <p className="mt-2 text-sm font-medium text-slate-700">No money came in or went out on these dates</p>
            <p className="mt-0.5 text-xs text-slate-500">Pick a longer date range above to see the daily bars.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} stackOffset="sign" margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="20%">
              <CartesianGrid vertical={false} stroke="#EEF2F6" />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => format(dayFromKey(d), "d MMM")}
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickLine={false}
                axisLine={false}
                minTickGap={16}
                interval="preserveStartEnd"
              />
              <YAxis
                width={52}
                domain={[-max, max]}
                tickFormatter={(v: number) => formatINRShort(Math.abs(v))}
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickLine={false}
                axisLine={false}
                ticks={ticks}
              />
              <ReferenceLine y={0} stroke="#94A3B8" />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#F1F5F9" }} />
              <Bar dataKey="in" stackId="d" fill={IN} radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false} />
              <Bar dataKey="outNeg" stackId="d" fill={OUT} radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

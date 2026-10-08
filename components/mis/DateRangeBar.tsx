"use client";

import { format, parse, startOfDay, subDays } from "date-fns";
import DatePicker from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";

// YYYY-MM-DD in local (India) time.
export const ymd = (d: Date) => format(d, "yyyy-MM-dd");
const fromYmd = (s: string) => parse(s, "yyyy-MM-dd", new Date());

// "N days" = the last N days including today (Today = 1 day).
export const PRESETS = [
  { label: "Today", days: 1 },
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
] as const;

export const presetRange = (days: number) => {
  const today = startOfDay(new Date());
  return { start: ymd(subDays(today, days - 1)), end: ymd(today) };
};

interface DateRangeBarProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

/**
 * Quick buttons (Today / 7 / 14 / 30 days) + a custom From–To range with the
 * shared calendar (no future days). Picking From after To moves To along.
 */
export default function DateRangeBar({
  startDate,
  endDate,
  onChange,
}: DateRangeBarProps) {
  const active = PRESETS.find((p) => {
    const r = presetRange(p.days);
    return r.start === startDate && r.end === endDate;
  });

  return (
    <div className="flex flex-wrap items-end gap-3" data-testid="date-range-bar">
      <div>
        <span className="text-xs text-muted-foreground block mb-1">Quick</span>
        <div className="inline-flex rounded-md border bg-white p-0.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                const r = presetRange(p.days);
                onChange(r.start, r.end);
              }}
              className={cn(
                "h-9 px-3 text-sm rounded-[5px] whitespace-nowrap transition-colors",
                active?.label === p.label
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-slate-600 hover:bg-slate-100"
              )}
              aria-pressed={active?.label === p.label}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="w-48">
        <span className="text-xs text-muted-foreground block mb-1">From</span>
        <DatePicker
          id="mis-from"
          date={fromYmd(startDate)}
          onDateChange={(d) => {
            if (!d) return;
            const s = ymd(d);
            onChange(s, s > endDate ? s : endDate);
          }}
        />
      </div>
      <div className="w-48">
        <span className="text-xs text-muted-foreground block mb-1">To</span>
        <DatePicker
          id="mis-to"
          date={fromYmd(endDate)}
          onDateChange={(d) => {
            if (!d) return;
            const e = ymd(d);
            onChange(e < startDate ? e : startDate, e);
          }}
        />
      </div>
    </div>
  );
}

"use client";

import { addDays, format, parse, startOfDay, startOfMonth, startOfYear, subMonths } from "date-fns";
import DatePicker from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";

export type PeriodPreset = "all" | "month" | "3m" | "year" | "custom";

export interface PeriodValue {
  preset: PeriodPreset;
  /** yyyy-MM-dd; undefined = no lower limit ("All time"). */
  from?: string;
  /** yyyy-MM-dd; undefined = up to today. */
  to?: string;
}

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "month", label: "This month" },
  { key: "3m", label: "Last 3 months" },
  { key: "year", label: "This year" },
  { key: "custom", label: "Custom" },
];

const ymd = (d: Date) => format(d, "yyyy-MM-dd");
const fromYmd = (s: string) => parse(s, "yyyy-MM-dd", new Date());

/**
 * The from / to for a preset.
 *   month: 1st of this month → today
 *   3m:    same day 3 months ago + 1 → today (e.g. 10 Jul → 9 Oct)
 *   year:  1 Jan → today, or 1 Apr (financial year) when yearStart = "financial"
 */
export function periodRange(
  preset: Exclude<PeriodPreset, "custom">,
  opts: { today?: Date; yearStart?: "calendar" | "financial" } = {}
): PeriodValue {
  const today = startOfDay(opts.today ?? new Date());
  const to = ymd(today);
  switch (preset) {
    case "all":
      return { preset };
    case "month":
      return { preset, from: ymd(startOfMonth(today)), to };
    case "3m":
      return { preset, from: ymd(addDays(subMonths(today, 3), 1)), to };
    case "year": {
      if (opts.yearStart === "financial") {
        const fyYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
        return { preset, from: ymd(new Date(fyYear, 3, 1)), to };
      }
      return { preset, from: ymd(startOfYear(today)), to };
    }
  }
}

/** First day the MIS APIs are asked for when the filter is "All time". */
export const ALL_TIME_START = "2020-01-01";

/** The MIS APIs need both dates: fill the open ends. */
export const periodToApiRange = (v: PeriodValue, today = new Date()) => ({
  startDate: v.from ?? ALL_TIME_START,
  endDate: v.to ?? ymd(startOfDay(today)),
});

/** "1 Jul – 9 Oct 2026" / "Everything up to today". */
export function periodCaption(v: PeriodValue) {
  if (!v.from && !v.to) return "Everything up to today";
  const f = v.from ? fromYmd(v.from) : null;
  const t = v.to ? fromYmd(v.to) : new Date();
  if (!f) return `Up to ${format(t, "d MMM yyyy")}`;
  if (v.from === v.to) return format(f, "d MMM yyyy");
  const sameYear = f.getFullYear() === t.getFullYear();
  return `${format(f, sameYear ? "d MMM" : "d MMM yyyy")} – ${format(t, "d MMM yyyy")}`;
}

export interface PeriodFilterProps {
  value: PeriodValue;
  onChange: (v: PeriodValue) => void;
  /** "This year" from 1 Jan (default) or from 1 Apr. */
  yearStart?: "calendar" | "financial";
  /** Show the resolved dates under the chips (default true). */
  caption?: boolean;
  className?: string;
}

/**
 * Compact period chips for inside a modal: All time / This month /
 * Last 3 months / This year / Custom. Custom shows two shared DatePickers
 * (no future days). Chips wrap to two lines at 390px; nothing scrolls sideways.
 */
export function PeriodFilter({ value, onChange, yearStart = "calendar", caption = true, className }: PeriodFilterProps) {
  const pick = (key: PeriodPreset) => {
    if (key === "custom") {
      // Start the custom range from what is showing now, else this month.
      const base = value.from ? value : periodRange("month");
      onChange({ preset: "custom", from: base.from, to: base.to ?? ymd(startOfDay(new Date())) });
    } else onChange(periodRange(key, { yearStart }));
  };

  return (
    <div className={cn("space-y-2", className)} data-testid="period-filter">
      <div role="radiogroup" aria-label="Period" className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const on = value.preset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => pick(p.key)}
              className={cn(
                "h-8 whitespace-nowrap rounded-full border px-3 text-[13px] transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
                "active:scale-[0.98]",
                on
                  ? "border-primary bg-primary font-medium text-primary-foreground"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {value.preset === "custom" && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <span className="mb-1 block text-xs text-slate-500">From</span>
            <DatePicker
              id="period-from"
              date={value.from ? fromYmd(value.from) : undefined}
              onDateChange={(d) => {
                if (!d) return;
                const s = ymd(d);
                onChange({ preset: "custom", from: s, to: value.to && s > value.to ? s : value.to });
              }}
            />
          </div>
          <div>
            <span className="mb-1 block text-xs text-slate-500">To</span>
            <DatePicker
              id="period-to"
              date={value.to ? fromYmd(value.to) : undefined}
              onDateChange={(d) => {
                if (!d) return;
                const e = ymd(d);
                onChange({ preset: "custom", from: value.from && e < value.from ? e : value.from, to: e });
              }}
            />
          </div>
        </div>
      )}

      {caption && value.preset !== "custom" && (
        <p className="text-xs text-slate-500">{periodCaption(value)}</p>
      )}
    </div>
  );
}

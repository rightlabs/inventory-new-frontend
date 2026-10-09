import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatINRSmart } from "@/utils/formatSmart";
import { SignedAmount } from "./SignedAmount";

export interface DayTotals {
  date: Date;
  in: number;
  out: number;
  net: number;
  count?: number;
}

export interface DayGroupHeaderProps extends DayTotals {
  /**
   * The rows of this day are split across pages: say the totals are only for
   * what is shown. (Use when the table is paged by rows, not by days.)
   */
  partial?: boolean;
  className?: string;
}

/**
 * "Fri, 9 Oct 2026 · 11 entries        In ₹82,960 · Out ₹84,102 · Net −₹1,142"
 * Totals wrap under the date on narrow screens.
 */
export function DayGroupHeader({ date, in: moneyIn, out, net, count, partial, className }: DayGroupHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-4 gap-y-0.5", className)}>
      <p className="whitespace-nowrap">
        <span className="text-sm font-semibold text-slate-900">{format(date, "EEE, d MMM yyyy")}</span>
        {count !== undefined && (
          <span className="ml-2 text-xs text-slate-500">
            {count} {count === 1 ? "entry" : "entries"}
            {partial ? " on this page" : ""}
          </span>
        )}
      </p>
      <dl className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[13px] md:ml-auto">
        {moneyIn !== 0 && (
          <div className="flex items-baseline gap-1 whitespace-nowrap">
            <dt className="text-slate-500">In</dt>
            <dd className="font-medium tabular-nums text-emerald-700">{formatINRSmart(moneyIn)}</dd>
          </div>
        )}
        {out !== 0 && (
          <div className="flex items-baseline gap-1 whitespace-nowrap">
            <dt className="text-slate-500">Out</dt>
            <dd className="font-medium tabular-nums text-rose-700">{formatINRSmart(out)}</dd>
          </div>
        )}
        {/* Net only says something new when the day had both in and out. */}
        {moneyIn !== 0 && out !== 0 && (
          <div className="flex items-baseline gap-1 whitespace-nowrap border-l border-slate-200 pl-3">
            <dt className="text-slate-500">Net</dt>
            <dd>
              <SignedAmount value={net} plus />
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export interface DayGroupRowProps extends DayGroupHeaderProps {
  /** Number of columns in the table. */
  colSpan: number;
  /**
   * Stick under the table's sticky <thead> while that day's rows scroll.
   * Pass the thead height in px (the MIS tables' header is 45px). false = off.
   */
  stickyTop?: number | false;
}

/** The DayGroupHeader as a full-width <tr> for a table body. */
export function DayGroupRow({ colSpan, stickyTop = 45, className, ...header }: DayGroupRowProps) {
  return (
    <tr data-testid="day-group">
      <th
        scope="colgroup"
        colSpan={colSpan}
        className={cn(
          "border-y border-slate-200 bg-slate-50 px-3 py-2 text-left font-normal",
          // z-10 sits under the thead (z-20) and over the rows.
          stickyTop !== false && "sticky z-10",
          className
        )}
        style={stickyTop !== false ? { top: stickyTop } : undefined}
      >
        <DayGroupHeader {...header} />
      </th>
    </tr>
  );
}

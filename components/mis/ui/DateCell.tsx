import { differenceInCalendarDays, format } from "date-fns";
import { cn } from "@/lib/utils";

export interface DateCellProps {
  date: string | Date;
  /** Add the time under the date ("10:03 am"). */
  time?: boolean;
  /** "auto": Today / Yesterday, else the weekday. "weekday": always the weekday. "none": no hint. */
  hint?: "auto" | "weekday" | "none";
  /** "Today" relative to this day (tests / demo). Default: now. */
  now?: Date;
  className?: string;
}

/** Today / Yesterday / weekday — the small grey line under a date. */
export const dateHint = (d: Date, now = new Date(), mode: "auto" | "weekday" = "auto") => {
  if (mode === "auto") {
    const diff = differenceInCalendarDays(now, d);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
  }
  return format(d, "EEE");
};

/**
 * Table date: "9 Oct 2026" on top, "Fri" / "Today" / "Yesterday" (and the
 * time if asked) under it. The day number sits in a fixed 2-digit box, so
 * months and years line up down the column.
 */
export function DateCell({ date, time = false, hint = "auto", now, className }: DateCellProps) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return <span className="text-slate-400">—</span>;
  const h = hint === "none" ? null : dateHint(d, now, hint);
  const recent = h === "Today" || h === "Yesterday";
  return (
    <span className={cn("inline-flex flex-col items-start leading-tight", className)}>
      <time dateTime={d.toISOString()} className="whitespace-nowrap text-sm tabular-nums text-slate-900">
        <span className="inline-block w-[2ch] text-right">{format(d, "d")}</span> {format(d, "MMM yyyy")}
      </time>
      {(h || time) && (
        <span className={cn("mt-0.5 text-xs", recent ? "font-medium text-slate-700" : "text-slate-500")}>
          {h}
          {h && time ? " · " : ""}
          {time ? format(d, "h:mm a").toLowerCase() : ""}
        </span>
      )}
    </span>
  );
}

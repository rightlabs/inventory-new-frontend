"use client";

import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfDay, startOfMonth, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { DayPicker } from "react-day-picker";

// The oldest record in the data is from April 2026, so the year list starts
// there. Override per use with `fromYear` if older data ever needs entering.
export const FIRST_DATA_YEAR = 2026;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// "Wed, 15 Sep 2026" — spelled out so a wrong month or year is obvious.
export const formatLongDate = (d: Date) => format(d, "EEE, d MMM yyyy");

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  /** Allow picking days after today (default: false — future days disabled). */
  allowFuture?: boolean;
  /** First year in the year dropdown (default: FIRST_DATA_YEAR). */
  fromYear?: number;
  id?: string;
}

/**
 * Calendar-only date picker: no free typing. Month and year are dropdowns,
 * future days are disabled (unless allowFuture), and a "Today" button jumps
 * back to today. The chosen date shows in words, e.g. "Wed, 15 Sep 2026".
 */
const DatePicker = ({
  date,
  onDateChange,
  allowFuture = false,
  fromYear = FIRST_DATA_YEAR,
  id,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const today = startOfDay(new Date());
  const thisMonth = startOfMonth(today);
  const firstYear = Math.min(fromYear, today.getFullYear(), date?.getFullYear() ?? Infinity);
  const lastYear = allowFuture ? today.getFullYear() + 5 : today.getFullYear();
  const startMonth = new Date(firstYear, 0, 1);
  const endMonth = allowFuture ? new Date(lastYear, 11, 1) : thisMonth;

  const clampMonth = (m: Date) => {
    const s = startOfMonth(m);
    if (s < startMonth) return startMonth;
    if (s > endMonth) return endMonth;
    return s;
  };

  const [month, setMonth] = useState<Date>(clampMonth(date ?? today));

  const years: number[] = [];
  for (let y = lastYear; y >= firstYear; y--) years.push(y);

  const handleOpenChange = (next: boolean) => {
    if (next) setMonth(clampMonth(date ?? today));
    setOpen(next);
  };

  const pick = (d: Date | undefined) => {
    if (!d) return;
    if (!allowFuture && startOfDay(d) > today) return;
    onDateChange(d);
    setOpen(false);
  };

  const canPrev = month > startMonth;
  const canNext = month < endMonth;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          data-testid="date-picker-trigger"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {date ? formatLongDate(date) : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start" data-testid="date-picker">
        {/* Month / year header */}
        <div className="flex items-center gap-2 pb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={!canPrev}
            onClick={() => setMonth(clampMonth(addMonths(month, -1)))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select
            value={String(month.getMonth())}
            onValueChange={(v) =>
              setMonth(clampMonth(new Date(month.getFullYear(), Number(v), 1)))
            }
          >
            <SelectTrigger className="h-9 w-[130px]" aria-label="Month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((name, i) => {
                const m = new Date(month.getFullYear(), i, 1);
                return (
                  <SelectItem
                    key={name}
                    value={String(i)}
                    disabled={m > endMonth || m < startOfMonth(startMonth)}
                  >
                    {name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select
            value={String(month.getFullYear())}
            onValueChange={(v) =>
              setMonth(clampMonth(new Date(Number(v), month.getMonth(), 1)))
            }
          >
            <SelectTrigger className="h-9 w-[90px]" aria-label="Year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={!canNext}
            onClick={() => setMonth(clampMonth(addMonths(month, 1)))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <DayPicker
          mode="single"
          selected={date}
          onSelect={pick}
          month={month}
          onMonthChange={(m) => setMonth(clampMonth(m))}
          startMonth={startMonth}
          endMonth={endMonth}
          disabled={allowFuture ? undefined : { after: today }}
          hideNavigation
          components={{ MonthCaption: () => <></> }}
          classNames={{
            root: "",
            months: "flex flex-col",
            month: "space-y-1",
            month_grid: "w-full border-collapse",
            weekdays: "flex",
            weekday:
              "w-10 text-center text-[0.8rem] font-normal text-muted-foreground",
            week: "flex w-full mt-1",
            day: "h-10 w-10 p-0 text-center text-sm",
            day_button: cn(
              "h-10 w-10 rounded-md font-normal transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            ),
            selected:
              "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:font-semibold",
            today: "[&>button]:border [&>button]:border-primary",
            outside: "text-muted-foreground opacity-40",
            disabled:
              "[&>button]:text-muted-foreground [&>button]:opacity-35 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent",
            hidden: "invisible",
          }}
        />

        <div className="flex items-center justify-between border-t pt-2 mt-2">
          <span className="text-xs text-muted-foreground">
            {date ? formatLongDate(date) : "No date chosen"}
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => pick(new Date())}
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;

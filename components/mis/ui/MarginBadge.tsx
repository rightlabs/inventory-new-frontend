import { TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MarginBadgeProps {
  /** Margin in %, e.g. 8.37. null = no sales, shows "—". */
  margin: number | null | undefined;
  /** Below this % (but not below 0) is "low" — amber. Default 5. */
  lowBelow?: number;
  /** Below this % is a loss — red. Default 0. */
  lossBelow?: number;
  /** Decimals to show. Default 1 ("8.4%"). */
  decimals?: number;
  className?: string;
}

export type MarginLevel = "good" | "low" | "loss" | "none";

export const marginLevel = (m: number | null | undefined, lowBelow = 5, lossBelow = 0): MarginLevel =>
  m === null || m === undefined || Number.isNaN(m) ? "none" : m < lossBelow ? "loss" : m < lowBelow ? "low" : "good";

const LEVEL_CLASS: Record<MarginLevel, string> = {
  good: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  low: "bg-amber-50 text-amber-800 ring-amber-200",
  loss: "bg-rose-50 text-rose-800 ring-rose-200",
  none: "bg-transparent text-slate-400 ring-transparent",
};

const LEVEL_SR: Record<MarginLevel, string> = {
  good: "good margin",
  low: "low margin",
  loss: "loss",
  none: "no sales",
};

/** Margin % as a coloured pill: green good, amber low, red loss. */
export function MarginBadge({ margin, lowBelow = 5, lossBelow = 0, decimals = 1, className }: MarginBadgeProps) {
  const level = marginLevel(margin, lowBelow, lossBelow);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset",
        LEVEL_CLASS[level],
        className
      )}
      title={level === "low" ? `Below ${lowBelow}%` : undefined}
    >
      {level === "loss" && <TrendingDown className="h-3 w-3" aria-hidden />}
      {level === "none" ? "—" : `${(margin as number) < 0 ? "−" : ""}${Math.abs(margin as number).toFixed(decimals)}%`}
      <span className="sr-only">({LEVEL_SR[level]})</span>
    </span>
  );
}

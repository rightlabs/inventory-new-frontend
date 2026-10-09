import { ChevronRight, TrendingDown, Trophy, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINRSmart } from "@/utils/formatSmart";
import { InfoTip } from "./InfoTip";
import type { MisTerm, MisTermKey } from "./terms";

export interface HighlightCardProps {
  /** e.g. "Most profitable customer" */
  label: string;
  info?: MisTermKey | MisTerm;
  /** good = green trophy, bad = red trend-down, neutral = grey. */
  tone?: "good" | "bad" | "neutral";
  icon?: LucideIcon;
  /** The headline: a customer name, or "3 customers". */
  primary?: React.ReactNode;
  /** Small grey text after the headline, e.g. the customer code. */
  secondary?: React.ReactNode;
  /** Signed money shown big under the headline. */
  amount?: number;
  /** Word after the amount, e.g. "profit" or "total loss". */
  amountLabel?: string;
  /** One extra line, e.g. "Margin 8.4% · 12 bills". */
  sub?: React.ReactNode;
  /** Shown instead of the body when there is nothing to highlight. */
  emptyText?: string;
  isEmpty?: boolean;
  /** Makes the whole card a button (e.g. open the customer's bills). */
  onClick?: () => void;
  loading?: boolean;
  className?: string;
}

const TONE = {
  good: { tile: "bg-emerald-50 text-emerald-700", amount: "text-emerald-700", Icon: Trophy },
  bad: { tile: "bg-rose-50 text-rose-700", amount: "text-rose-700", Icon: TrendingDown },
  neutral: { tile: "bg-slate-100 text-slate-600", amount: "text-slate-900", Icon: Trophy },
} as const;

/** Customer Profit headline: "Most profitable customer", "Customers with a loss". */
export function HighlightCard({
  label,
  info,
  tone = "neutral",
  icon,
  primary,
  secondary,
  amount,
  amountLabel,
  sub,
  emptyText = "Nothing to show for these dates",
  isEmpty = false,
  onClick,
  loading = false,
  className,
}: HighlightCardProps) {
  const t = TONE[tone];
  const Icon = icon ?? t.Icon;
  const infoProps = typeof info === "string" ? { term: info } : info ? { content: info } : null;
  const clickable = !!onClick && !isEmpty && !loading;

  const body = loading ? (
    <div className="mt-2 space-y-2" aria-hidden>
      <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
      <div className="h-7 w-32 animate-pulse rounded bg-slate-100" />
    </div>
  ) : isEmpty ? (
    <p className="mt-2 text-sm text-slate-500">{emptyText}</p>
  ) : (
    <>
      {primary && (
        <p className="mt-1 flex min-w-0 items-baseline gap-1.5">
          <span className="truncate text-base font-semibold text-slate-900">{primary}</span>
          {secondary && <span className="shrink-0 text-xs text-slate-500">{secondary}</span>}
        </p>
      )}
      {amount !== undefined && (
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
          <span className={cn("text-2xl font-semibold tabular-nums tracking-tight", t.amount)}>
            {formatINRSmart(amount)}
          </span>
          {amountLabel && <span className="text-sm text-slate-500">{amountLabel}</span>}
        </p>
      )}
      {sub && <div className="mt-1 text-[13px] leading-5 text-slate-600">{sub}</div>}
    </>
  );

  return (
    <section
      className={cn(
        "relative flex min-w-0 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5",
        clickable && "transition-colors hover:border-slate-300 hover:bg-slate-50/60",
        className
      )}
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", t.tile)} aria-hidden>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
          {label}
          {/* ⓘ sits above the card-wide button so it stays tappable. */}
          {infoProps && <span className="relative z-[1] inline-flex"><InfoTip {...infoProps} /></span>}
        </h3>
        {body}
      </div>
      {clickable && (
        <>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 self-center text-slate-400" aria-hidden />
          {/* Whole-card hit area without nesting the ⓘ button inside another button. */}
          <button
            type="button"
            onClick={onClick}
            className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-[0.995]"
            aria-label={`${label}: open details`}
          />
        </>
      )}
    </section>
  );
}

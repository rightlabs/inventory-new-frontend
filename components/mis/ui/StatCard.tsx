import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINRSmart } from "@/utils/formatSmart";
import { InfoTip } from "./InfoTip";
import type { MisTerm, MisTermKey } from "./terms";

export type StatTone = "in" | "out" | "neutral" | "auto";

const TONE_TEXT = {
  in: "text-emerald-700",
  out: "text-rose-700",
  neutral: "text-slate-900",
} as const;

export const toneClass = (tone: StatTone, amount?: number | null) => {
  if (tone !== "auto") return TONE_TEXT[tone];
  if (amount === null || amount === undefined || Math.abs(amount) < 0.005) return TONE_TEXT.neutral;
  return amount > 0 ? TONE_TEXT.in : TONE_TEXT.out;
};

export interface StatCardProps {
  title: string;
  /** ⓘ explanation: a MIS_TERMS key or your own text. */
  info?: MisTermKey | MisTerm;
  /** Money. null / undefined shows "—". Ignored when `value` is given. */
  amount?: number | null;
  /** Show something other than money (e.g. "8.4%" or "12 bills"). */
  value?: React.ReactNode;
  /** in = green, out = red, neutral = dark, auto = green / red by sign. */
  tone?: StatTone;
  /** Small text on the right of the title, e.g. "232 payments". */
  meta?: React.ReactNode;
  icon?: LucideIcon;
  /** One line under the big number (plain text or e.g. <NetSentence/>). */
  sub?: React.ReactNode;
  /** Shown under a hairline, e.g. <ModeSplit/>. */
  children?: React.ReactNode;
  /** "lg" for 1–3 cards in a row, "md" for 4 in a row. */
  size?: "md" | "lg";
  loading?: boolean;
  className?: string;
  "data-testid"?: string;
}

/**
 * KPI card: the big number first, then what it means. Whole rupees show no
 * ".00"; paise show only when they exist.
 */
export function StatCard({
  title,
  info,
  amount,
  value,
  tone = "neutral",
  meta,
  icon: Icon,
  sub,
  children,
  size = "lg",
  loading = false,
  className,
  ...rest
}: StatCardProps) {
  const infoProps = typeof info === "string" ? { term: info } : info ? { content: info } : null;
  const shown =
    value ?? (amount === null || amount === undefined ? "—" : formatINRSmart(amount));
  // Crore-size amounts with paise ("₹37,99,233.37") step down one size so
  // they never spill out of a narrow card.
  const long = typeof shown === "string" && shown.length >= 13;

  return (
    <section
      className={cn("flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-5", className)}
      aria-busy={loading || undefined}
      data-testid={rest["data-testid"]}
    >
      {/* Wraps (meta drops under the title) instead of cutting the title. */}
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
        <h3 className="inline-flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-600">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />}
          <span>{title}</span>
          {infoProps && <InfoTip {...infoProps} />}
        </h3>
        {meta && !loading && (
          <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-slate-500">{meta}</span>
        )}
      </header>

      {loading ? (
        <div className="mt-2.5 space-y-2" aria-hidden>
          <div className={cn("animate-pulse rounded-md bg-slate-100", size === "lg" ? "h-9 w-44" : "h-8 w-36")} />
          {sub !== undefined && <div className="h-4 w-52 max-w-full animate-pulse rounded bg-slate-100" />}
        </div>
      ) : (
        <>
          <p
            className={cn(
              "mt-1.5 whitespace-nowrap font-semibold tabular-nums tracking-tight",
              size === "lg"
                ? long
                  ? "text-[26px] leading-9 2xl:text-[30px] 2xl:leading-10"
                  : "text-[28px] leading-9 sm:text-[32px] sm:leading-10"
                : long
                  ? "text-[22px] leading-8"
                  : "text-2xl leading-8",
              toneClass(tone, amount)
            )}
          >
            {shown}
          </p>
          {sub && <div className="mt-1 text-sm leading-5 text-slate-600">{sub}</div>}
        </>
      )}

      {children && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          {loading ? (
            <div className="space-y-2" aria-hidden>
              <div className="h-2 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </section>
  );
}

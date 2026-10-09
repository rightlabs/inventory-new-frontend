import { cn } from "@/lib/utils";
import { formatINRSmart } from "@/utils/formatSmart";

export interface SignedAmountProps {
  /** Signed value. With `direction`, pass the positive amount instead. */
  value: number;
  /** "in" shows +₹ in green, "out" shows −₹ in red. */
  direction?: "in" | "out";
  /** Show "+" on positive values (default true). */
  plus?: boolean;
  className?: string;
}

/**
 * "+₹500" green / "−₹300" red / "₹0" grey. Tabular numbers, right aligned,
 * never wraps. Paise only when they are not zero.
 */
export function SignedAmount({ value, direction, plus = true, className }: SignedAmountProps) {
  const v = direction ? (direction === "in" ? Math.abs(value) : -Math.abs(value)) : value;
  const isZero = Math.abs(v) < 0.005;
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap text-right font-medium tabular-nums",
        isZero ? "text-slate-500" : v > 0 ? "text-emerald-700" : "text-rose-700",
        className
      )}
    >
      {formatINRSmart(v, { signed: plus })}
    </span>
  );
}

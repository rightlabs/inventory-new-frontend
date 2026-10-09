import { Banknote, HelpCircle, ReceiptText, Smartphone, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINRSmart } from "@/utils/formatSmart";
import { modeParts, type ModeSplitLike, type PayMode } from "./helpers";
import { SignedAmount } from "./SignedAmount";

// Mode colours stay clear of green / red (those mean in / out on this screen)
// and differ in lightness too, so they still separate for colour-blind eyes.
export const MODE_META: Record<
  PayMode,
  { label: string; Icon: LucideIcon; bar: string; icon: string }
> = {
  cash: { label: "Cash", Icon: Banknote, bar: "bg-slate-600", icon: "text-slate-600" },
  online: { label: "Online", Icon: Smartphone, bar: "bg-blue-600", icon: "text-blue-600" },
  cheque: { label: "Cheque", Icon: ReceiptText, bar: "bg-amber-500", icon: "text-amber-600" },
  other: {
    label: "Not recorded",
    Icon: HelpCircle,
    bar: "bg-[repeating-linear-gradient(135deg,#cbd5e1_0_3px,#e2e8f0_3px_6px)]",
    icon: "text-slate-400",
  },
};

export interface ModeSplitProps {
  /** The API's split: { cash, online, cheque, other } (extra keys are ignored). */
  split: ModeSplitLike;
  /**
   * "auto" (default): a bar + chips when every mode is positive (Money in /
   * Money out); signed chips with no bar when some mode is negative (Net).
   */
  variant?: "auto" | "bar" | "signed";
  /** Show each mode's % of the total in the chips (bar view only). */
  showShare?: boolean;
  /** Text when every mode is 0. Pass null to render nothing. */
  emptyText?: string | null;
  className?: string;
}

/**
 * Replaces "= Cash ₹51,540.00 + Online ₹14,320.00 + Cheque ₹17,100.00".
 * Zero modes are hidden. Chips wrap as whole units, never mid-amount.
 */
export function ModeSplit({
  split,
  variant = "auto",
  showShare = false,
  emptyText = "No payments",
  className,
}: ModeSplitProps) {
  const { parts, allPositive } = modeParts(split);

  if (parts.length === 0) {
    return emptyText ? (
      <p className={cn("text-xs text-slate-500", className)}>{emptyText}</p>
    ) : null;
  }

  const signed = variant === "signed" || (variant === "auto" && !allPositive);

  if (signed) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]" aria-label="By payment mode">
          {parts.map(({ mode, value }) => {
            const m = MODE_META[mode];
            return (
              <li key={mode} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <m.Icon className={cn("h-3.5 w-3.5", m.icon)} aria-hidden />
                <span className="text-slate-600">{m.label}</span>
                <SignedAmount value={value} />
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] leading-4 text-slate-500">
          <span className="font-medium text-emerald-700">+</span> more came in ·{" "}
          <span className="font-medium text-rose-700">{"−"}</span> more went out
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Bar: decorative, the chips below carry the same numbers as text. */}
      <div className="flex h-2 w-full gap-[2px] overflow-hidden rounded-full bg-slate-100" aria-hidden>
        {parts.map(({ mode, share }) => (
          <div
            key={mode}
            className={cn("h-full min-w-[4px]", MODE_META[mode].bar)}
            style={{ flex: `${share} 1 0%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]" aria-label="By payment mode">
        {parts.map(({ mode, value, share }) => {
          const m = MODE_META[mode];
          return (
            <li key={mode} className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <m.Icon className={cn("h-3.5 w-3.5", m.icon)} aria-hidden />
              <span className="text-slate-600">{m.label}</span>
              <span className="font-medium tabular-nums text-slate-900">{formatINRSmart(value)}</span>
              {showShare && (
                <span className="tabular-nums text-slate-400">{Math.round(share * 100)}%</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

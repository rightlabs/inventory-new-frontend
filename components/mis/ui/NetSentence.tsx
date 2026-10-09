import { ArrowDownLeft, ArrowUpRight, Equal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINRSmart } from "@/utils/formatSmart";

export interface NetSentenceProps {
  /** Money in − money out. */
  net: number;
  className?: string;
}

/**
 * Plain words for the Net figure:
 *   −1142 -> "₹1,142 more went out than came in" (red)
 *    5000 -> "₹5,000 more came in than went out" (green)
 *       0 -> "Money in and out are equal" (grey)
 */
export function netSentenceText(net: number) {
  if (Math.abs(net) < 0.005) return "Money in and out are equal";
  const amt = formatINRSmart(Math.abs(net));
  return net > 0 ? `${amt} more came in than went out` : `${amt} more went out than came in`;
}

export function NetSentence({ net, className }: NetSentenceProps) {
  const zero = Math.abs(net) < 0.005;
  const Icon = zero ? Equal : net > 0 ? ArrowDownLeft : ArrowUpRight;
  return (
    <p
      className={cn(
        "inline-flex items-start gap-1.5 text-sm font-medium leading-5",
        zero ? "text-slate-600" : net > 0 ? "text-emerald-700" : "text-rose-700",
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{netSentenceText(net)}</span>
    </p>
  );
}

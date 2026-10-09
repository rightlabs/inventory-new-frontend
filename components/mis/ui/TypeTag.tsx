import {
  Building2,
  FileText,
  HandCoins,
  HelpCircle,
  ShoppingCart,
  Truck,
  Undo2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CashRowType } from "./helpers";

export const TYPE_META: Record<CashRowType, { label: string; Icon: LucideIcon; className: string }> = {
  sale: { label: "Sale payment", Icon: FileText, className: "bg-sky-50 text-sky-800 ring-sky-200" },
  receipt: { label: "Receipt", Icon: HandCoins, className: "bg-teal-50 text-teal-800 ring-teal-200" },
  advance: { label: "Advance", Icon: Wallet, className: "bg-indigo-50 text-indigo-800 ring-indigo-200" },
  vendor: { label: "Vendor payment", Icon: Building2, className: "bg-slate-100 text-slate-700 ring-slate-200" },
  purchase: { label: "Purchase payment", Icon: ShoppingCart, className: "bg-slate-100 text-slate-700 ring-slate-200" },
  freight: { label: "Freight", Icon: Truck, className: "bg-amber-50 text-amber-800 ring-amber-200" },
  // Refund is the one staff must not miss: filled, stronger ring, bold.
  refund: { label: "Refund", Icon: Undo2, className: "bg-rose-100 text-rose-800 ring-rose-300 font-semibold" },
  other: { label: "Other", Icon: HelpCircle, className: "bg-slate-50 text-slate-600 ring-slate-200" },
};

export interface TypeTagProps {
  type: CashRowType;
  /** Override the default text (e.g. "Payment received"). */
  label?: string;
  className?: string;
}

/** Small tag for a cash-book row. Use cashRowType(row) to get `type`. */
export function TypeTag({ type, label, className }: TypeTagProps) {
  const m = TYPE_META[type] ?? TYPE_META.other;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        m.className,
        className
      )}
    >
      <m.Icon className="h-3 w-3 shrink-0" aria-hidden />
      {label ?? m.label}
    </span>
  );
}

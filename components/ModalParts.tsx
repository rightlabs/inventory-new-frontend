// Small display helpers shared by the non-MIS modals (ledger, payments,
// returns, price history, sale / purchase forms). They only change how a
// value LOOKS — every amount still goes through formatINR, so the digits are
// the same as before (2 decimals, Indian commas).
import { format } from "date-fns";
import {
  Ban,
  FileText,
  Flag,
  HandCoins,
  ReceiptText,
  ShoppingCart,
  Undo2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/utils/format";
import { CodeBadge } from "@/components/mis/ui";

/** "9 Oct 2026" — the one date format used in modal headers. */
export const longDate = (d: string | Date | undefined | null) => {
  if (!d) return "";
  const x = new Date(d);
  return isNaN(x.getTime()) ? "" : format(x, "d MMM yyyy");
};

/** ₹ amount for tables: tabular digits, never wraps. Same text as formatINR. */
export function Money({ value, className }: { value: number | string | null | undefined; className?: string }) {
  return <span className={cn("whitespace-nowrap tabular-nums", className)}>{formatINR(value)}</span>;
}

/**
 * Signed ₹ for a direction: "+₹1,818.00" / "−₹580.00". Same digits as
 * formatINR; only the sign and colour are added.
 */
export function SignedINR({
  value,
  sign,
  tone,
  className,
}: {
  value: number;
  sign: "+" | "−";
  tone: "up" | "down" | "muted";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "whitespace-nowrap font-medium tabular-nums",
        tone === "up" && "text-rose-700",
        tone === "down" && "text-emerald-700",
        tone === "muted" && "text-slate-500",
        className
      )}
    >
      {sign}
      {formatINR(Math.abs(value))}
    </span>
  );
}

/**
 * Code pill that may wrap (long receipt numbers like RCT-C004-1788690460357
 * must stay fully visible in narrow columns). Short codes behave like the
 * kit's CodeBadge.
 */
export function WrapCode({ code, className }: { code: string; className?: string }) {
  if (!code) return null;
  return (
    <CodeBadge
      code={code}
      className={cn(code.length > 12 && "whitespace-normal [overflow-wrap:anywhere]", className)}
    />
  );
}

/** Name + code pill, the way every modal header shows a party. */
export function PartyName({
  name,
  code,
  className,
}: {
  name?: string | null;
  code?: string | null;
  className?: string;
}) {
  if (!name && !code) return null;
  return (
    <span className={cn("inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1", className)}>
      {name && <span className="min-w-0 font-semibold text-slate-900 [overflow-wrap:anywhere]">{name}</span>}
      {code && <CodeBadge code={code} />}
    </span>
  );
}

/** One label / value pair inside a FactStrip. */
export function Fact({
  label,
  children,
  className,
  testId,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div className={cn("min-w-0", className)} data-testid={testId}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-slate-900 tabular-nums [overflow-wrap:anywhere]">{children}</div>
    </div>
  );
}

/** Light summary strip for the facts at the top of a modal. */
export function FactStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5", className)}>
      {children}
    </div>
  );
}

// ------------------------------------------------------------- ledger rows

export type LedgerKind =
  | "opening"
  | "sale"
  | "purchase"
  | "payment"
  | "advance"
  | "return"
  | "cancel"
  | "refund";

export const LEDGER_KIND: Record<LedgerKind, { label: string; Icon: LucideIcon; className: string }> = {
  opening: { label: "Opening balance", Icon: Flag, className: "bg-amber-50 text-amber-900 ring-amber-200" },
  sale: { label: "Sale", Icon: FileText, className: "bg-sky-50 text-sky-800 ring-sky-200" },
  purchase: { label: "Purchase", Icon: ShoppingCart, className: "bg-slate-100 text-slate-700 ring-slate-200" },
  payment: { label: "Payment", Icon: HandCoins, className: "bg-teal-50 text-teal-800 ring-teal-200" },
  advance: { label: "Advance", Icon: Wallet, className: "bg-indigo-50 text-indigo-800 ring-indigo-200" },
  return: { label: "Return", Icon: Undo2, className: "bg-rose-50 text-rose-800 ring-rose-200" },
  cancel: { label: "Bill cancelled", Icon: Ban, className: "bg-rose-50 text-rose-800 ring-rose-200" },
  // Money given back — the one row staff must not miss.
  refund: { label: "Refund", Icon: ReceiptText, className: "bg-rose-100 text-rose-900 ring-rose-300 font-semibold" },
};

/**
 * Row kind from the fields the ledger API returns (documentNumber, type,
 * mode, notes). Mirrors how the backend writes each entry.
 */
export const ledgerKind = (t: {
  documentNumber?: string;
  type: "debit" | "credit";
  mode: string;
  notes?: string;
}): LedgerKind => {
  const doc = (t.documentNumber || "").toUpperCase();
  const notes = (t.notes || "").toLowerCase();
  if (doc === "OPENING_BALANCE" || notes.startsWith("opening balance")) return "opening";
  if (notes.includes("refund")) return "refund";
  if (t.mode === "return") {
    if (/cancelled/.test(notes)) return "cancel";
    return t.type === "debit" ? "refund" : "return";
  }
  if (/^RET\d/.test(doc)) return "return";
  if (t.mode === "advance" || doc.startsWith("ADV-")) return "advance";
  if (t.mode === "sale") return "sale";
  if (t.mode === "purchase") return "purchase";
  return "payment";
};

export function LedgerTag({ kind, label, className }: { kind: LedgerKind; label?: string; className?: string }) {
  const m = LEDGER_KIND[kind];
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

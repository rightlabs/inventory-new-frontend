import { cn } from "@/lib/utils";

export type CodeKind = "customer" | "vendor" | "sale" | "return" | "purchase" | "payment" | "other";

/** Guess the kind from the code's prefix (C153, V006, SO883, RET004, PO032, VPAY-0001). */
export const codeKind = (code: string): CodeKind => {
  const c = code.trim().toUpperCase();
  if (/^VPAY-?\d/.test(c)) return "payment";
  if (/^RET\d/.test(c)) return "return";
  if (/^SO\d/.test(c)) return "sale";
  if (/^PO\d/.test(c)) return "purchase";
  if (/^C\d/.test(c)) return "customer";
  if (/^V\d/.test(c)) return "vendor";
  return "other";
};

export const CODE_META: Record<CodeKind, { label: string; className: string }> = {
  customer: { label: "Customer code", className: "bg-teal-50 text-teal-800 ring-teal-200/80" },
  vendor: { label: "Vendor code", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  sale: { label: "Bill number", className: "bg-sky-50 text-sky-800 ring-sky-200/80" },
  return: { label: "Return number", className: "bg-rose-50 text-rose-800 ring-rose-200/80" },
  purchase: { label: "Purchase number", className: "bg-amber-50 text-amber-800 ring-amber-200/80" },
  payment: { label: "Payment number", className: "bg-indigo-50 text-indigo-800 ring-indigo-200/80" },
  other: { label: "Code", className: "bg-slate-50 text-slate-600 ring-slate-200" },
};

export interface CodeBadgeProps {
  code: string;
  /** Leave out to detect from the prefix. */
  kind?: CodeKind;
  className?: string;
}

/**
 * Code as a small monospace pill, tinted by kind, so "C153" never blends into
 * the name next to it. Monospace keeps 0 / O and 1 / I apart.
 */
export function CodeBadge({ code, kind, className }: CodeBadgeProps) {
  if (!code) return null;
  const k = kind ?? codeKind(code);
  const m = CODE_META[k];
  return (
    <span
      title={m.label}
      className={cn(
        "relative inline-flex items-center whitespace-nowrap rounded px-1.5 py-px align-[1px] font-mono text-[11px] font-medium leading-4 tracking-tight ring-1 ring-inset",
        m.className,
        className
      )}
    >
      <span className="sr-only">{m.label} </span>
      {code}
    </span>
  );
}

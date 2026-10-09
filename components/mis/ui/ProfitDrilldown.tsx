import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINRSmart } from "@/utils/formatSmart";
import { CodeBadge } from "./CodeBadge";
import { DateCell } from "./DateCell";
import { InfoTip } from "./InfoTip";
import { MarginBadge } from "./MarginBadge";
import { SignedAmount } from "./SignedAmount";
import { TypeTag } from "./TypeTag";

// Row helpers for the Customer Profit drill-down modal. Same 6 columns as
// today (Date | Bill / Return | Sales | Cost | Returns | Profit) — only how
// each cell reads changes. Numbers come straight from the API.

export interface ProfitEntryLike {
  type: "bill" | "sale-return" | "customer-return";
  number: string;
  date: string;
  sales: number;
  cost: number;
  returns: number;
  profit: number;
  /** Return rows: cost of the goods that came back (positive). */
  costBack?: number;
}

export interface ProfitTotalsLike {
  bills: number;
  sales: number;
  returns: number;
  cost: number;
  returnsCost?: number;
  profit: number;
  margin: number | null;
}

const td = "px-3 py-2.5 align-middle";
const num = "text-right tabular-nums whitespace-nowrap";

// ------------------------------------------------------------ header
export interface PartyTitleProps {
  name: string;
  code?: string;
  phone?: string;
  className?: string;
}

/** Modal title line: name, code pill, phone (tap to call). */
export function PartyTitle({ name, code, phone, className }: PartyTitleProps) {
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <span className="min-w-0 truncate text-lg font-semibold text-slate-900">{name}</span>
      {code && <CodeBadge code={code} kind="customer" />}
      {phone && (
        <a
          href={`tel:${phone}`}
          className="inline-flex items-center gap-1 rounded text-[13px] tabular-nums text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <Phone className="h-3.5 w-3.5" aria-hidden />
          {phone}
        </a>
      )}
    </div>
  );
}

// ------------------------------------------------------------ summary chips
/** "Bills 38 · Sales ₹8,30,193 · Returns … · Cost … · Profit … · Margin [10.6%]" */
export function ProfitSummaryChips({
  totals,
  marginDecimals = 2,
  className,
}: {
  totals: ProfitTotalsLike;
  /** Same decimals as the margin elsewhere on the MIS page. */
  marginDecimals?: number;
  className?: string;
}) {
  // 2-up grid on phones (tidy rows), one wrapping line from sm up.
  const chip =
    "flex items-baseline justify-between gap-1.5 whitespace-nowrap rounded-md bg-slate-50 px-2.5 py-1.5 ring-1 ring-inset ring-slate-200/70 sm:inline-flex sm:justify-start";
  const label = "text-xs text-slate-500";
  const value = "text-sm font-semibold tabular-nums text-slate-900";
  return (
    <dl className={cn("grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap", className)} data-testid="profit-summary">
      <div className={chip}>
        <dt className={label}>Bills</dt>
        <dd className={value}>{totals.bills.toLocaleString("en-IN")}</dd>
      </div>
      <div className={chip}>
        <dt className={label}>Sales</dt>
        <dd className={value}>{formatINRSmart(totals.sales)}</dd>
      </div>
      {totals.returns !== 0 && (
        <div className={chip}>
          <dt className={label}>Returns</dt>
          <dd className={value}>{formatINRSmart(totals.returns)}</dd>
        </div>
      )}
      <div className={chip}>
        <dt className={label}>Cost</dt>
        <dd className={value}>{formatINRSmart(totals.cost)}</dd>
      </div>
      <div className={chip}>
        <dt className={label}>Profit</dt>
        <dd>
          <SignedAmount value={totals.profit} plus={false} className="text-sm font-semibold" />
        </dd>
      </div>
      <div className={cn(chip, "items-center")}>
        <dt className={label}>Margin</dt>
        <dd>
          <MarginBadge margin={totals.margin} decimals={marginDecimals} />
        </dd>
      </div>
    </dl>
  );
}

// ------------------------------------------------------------ rows
/** One bill or return as a <tr>. Return rows are tinted and say "Cost back". */
export function ProfitEntryRow({ entry, className }: { entry: ProfitEntryLike; className?: string }) {
  const isReturn = entry.type !== "bill";
  return (
    <tr className={cn("border-b border-slate-100 last:border-b-0", isReturn && "bg-rose-50/40", className)} data-testid={isReturn ? "cp-return-row" : "cp-bill-row"}>
      <td className={td}>
        <DateCell date={entry.date} hint="weekday" />
      </td>
      <td className={td}>
        {entry.type === "bill" ? (
          <CodeBadge code={entry.number} kind="sale" />
        ) : (
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <TypeTag type="return" />
            {entry.type === "sale-return" ? (
              <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-slate-500">
                on <CodeBadge code={entry.number} kind="sale" />
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-slate-500">
                <CodeBadge code={entry.number} kind="return" /> no bill
              </span>
            )}
          </span>
        )}
      </td>
      <td className={cn(td, num, "text-slate-900")}>{entry.sales ? formatINRSmart(entry.sales) : <span className="text-slate-300">—</span>}</td>
      <td className={cn(td, num)}>
        {isReturn ? (
          <span className="inline-flex items-center justify-end gap-1 text-[13px] text-slate-500">
            Cost back {formatINRSmart(entry.costBack ?? Math.abs(entry.cost))}
            <InfoTip term="costBack" side="left" />
          </span>
        ) : (
          <span className="text-slate-900">{formatINRSmart(entry.cost)}</span>
        )}
      </td>
      <td className={cn(td, num, "text-slate-900")}>{entry.returns ? formatINRSmart(entry.returns) : <span className="text-slate-300">—</span>}</td>
      <td className={cn(td, num)}>
        <SignedAmount value={entry.profit} plus={false} />
      </td>
    </tr>
  );
}

/** <tfoot> total row: heavier rule, tinted, bigger profit. */
export function ProfitTotalRow({ totals, returnsCount }: { totals: ProfitTotalsLike; returnsCount?: number }) {
  return (
    <tr className="border-t-2 border-slate-300 bg-slate-50" data-testid="cp-total-row">
      <td className={cn(td, "py-3")} colSpan={2}>
        <span className="text-sm font-semibold text-slate-900">Total</span>
        <span className="ml-2 text-xs text-slate-500">
          {totals.bills} {totals.bills === 1 ? "bill" : "bills"}
          {returnsCount ? ` · ${returnsCount} ${returnsCount === 1 ? "return" : "returns"}` : ""}
        </span>
      </td>
      <td className={cn(td, num, "py-3 font-semibold text-slate-900")}>{formatINRSmart(totals.sales)}</td>
      <td className={cn(td, num, "py-3")}>
        <span className="block font-semibold text-slate-900">{formatINRSmart(totals.cost)}</span>
        {!!totals.returnsCost && (
          <span className="block text-[11px] text-slate-500">after {formatINRSmart(totals.returnsCost)} back</span>
        )}
      </td>
      <td className={cn(td, num, "py-3 font-semibold text-slate-900")}>
        {totals.returns ? formatINRSmart(totals.returns) : <span className="text-slate-300">—</span>}
      </td>
      <td className={cn(td, num, "py-3")}>
        <SignedAmount value={totals.profit} plus={false} className="text-base font-semibold" />
      </td>
    </tr>
  );
}

/** The column header row, same columns as the current modal. */
export function ProfitEntryHead() {
  const th = "px-3 py-2.5 text-xs font-medium text-slate-600";
  return (
    <tr className="border-b border-slate-200">
      <th className={cn(th, "text-left")}>Date</th>
      <th className={cn(th, "text-left")}>Bill / Return</th>
      <th className={cn(th, "text-right")}>Sales</th>
      <th className={cn(th, "text-right")}>Cost</th>
      <th className={cn(th, "text-right")}>Returns</th>
      <th className={cn(th, "text-right")}>Profit</th>
    </tr>
  );
}

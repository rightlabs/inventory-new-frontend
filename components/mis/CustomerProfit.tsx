"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ChevronRight, Download, Inbox, Search, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DataPagination from "@/components/DataPagination";
import ListStatusRow from "@/components/ListStatusRow";
import {
  CustomerProfit as CustomerProfitData,
  CustomerProfitDetail,
  CustomerProfitRow,
  getCustomerProfit,
  getCustomerProfitDetail,
} from "@/api/mis";
import { getCustomerById } from "@/api/customer";
import { downloadCsv, rowsToCsv } from "@/utils/csv";
import { formatINRSmart } from "@/utils/formatSmart";
import { cn } from "@/lib/utils";
import {
  CodeBadge,
  EmptyRow,
  HighlightCard,
  InfoTip,
  MarginBadge,
  PartyTitle,
  PeriodFilter,
  ProfitEntryHead,
  ProfitEntryRow,
  ProfitSummaryChips,
  ProfitTotalRow,
  SignedAmount,
  customerHighlights,
  periodToApiRange,
  type PeriodValue,
} from "@/components/mis/ui";

const PAGE_SIZE = 20;
const DETAIL_PAGE_SIZE = 100;
const COLS = 9;

const plural = (n: number, one: string, many: string) =>
  `${n.toLocaleString("en-IN")} ${n === 1 ? one : many}`;

type Picked = Pick<CustomerProfitRow, "customerId" | "name" | "code">;

export default function CustomerProfit({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  // Whole range, every customer: totals, highlight cards and CSV.
  const [full, setFull] = useState<CustomerProfitData | null>(null);
  const [fullLoading, setFullLoading] = useState(true);
  // The table: server search + pages.
  const [list, setList] = useState<CustomerProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0); // Retry
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Picked | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [debounced, startDate, endDate]);

  useEffect(() => {
    let cancelled = false;
    setFullLoading(true);
    getCustomerProfit(startDate, endDate)
      .then((d) => !cancelled && setFull(d))
      .catch(() => !cancelled && setFull(null))
      .finally(() => !cancelled && setFullLoading(false));
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, reload]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    getCustomerProfit(startDate, endDate, { search: debounced, page, limit: PAGE_SIZE })
      .then((d) => !cancelled && setList(d))
      .catch(() => {
        if (cancelled) return;
        setList(null); // no stale rows / page footer
        setLoadError(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, debounced, page, reload]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [page]);

  const active = useMemo(() => (full?.rows || []).filter((r) => r.hasActivity), [full]);
  const hl = useMemo(() => (full ? customerHighlights(active) : null), [full, active]);

  const handleExport = () => {
    if (!full || !full.rows.length) {
      toast("No customers to export");
      return;
    }
    const rows: Record<string, unknown>[] = full.rows.map((r) => ({
      rank: r.rank,
      customer: r.name,
      code: r.code,
      activity: r.hasActivity ? "yes" : "no",
      bills: r.bills,
      sales: r.sales,
      cost: r.cost,
      returns: r.returns,
      profit: r.profit,
      marginPct: r.margin ?? "",
    }));
    const t = full.totals;
    rows.push({
      rank: "",
      customer: "TOTAL (all customers)",
      code: "",
      activity: `${t.customersWithActivity} of ${t.customers}`,
      bills: t.bills,
      sales: t.sales,
      cost: t.cost,
      returns: t.returns,
      profit: t.profit,
      marginPct: t.margin ?? "",
    });
    const headers = ["rank", "customer", "code", "activity", "bills", "sales", "cost", "returns", "profit", "marginPct"];
    downloadCsv(rowsToCsv(rows, headers), `customer-profit-${startDate}-to-${endDate}.csv`);
    toast.success(`Exported ${full.rows.length} customer(s)`);
  };

  const t = full?.totals;
  const rows = list?.rows || [];
  const pg = list?.pagination;
  const q = debounced.trim();

  return (
    <div className="space-y-4" data-testid="customer-profit">
      {/* Who made money, who lost it */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <HighlightCard
          label="Most profitable customer"
          info="grossProfit"
          tone="good"
          loading={fullLoading && !full}
          isEmpty={!hl?.top}
          emptyText="No customer made a profit on these dates"
          primary={hl?.top?.name}
          secondary={hl?.top?.code && <CodeBadge code={hl.top.code} kind="customer" />}
          amount={hl?.top?.profit}
          amountLabel="profit"
          sub={
            hl?.top && (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <MarginBadge margin={hl.top.margin} decimals={2} /> on {plural(hl.top.bills, "bill", "bills")} worth{" "}
                {formatINRSmart(hl.top.sales)}
              </span>
            )
          }
          onClick={hl?.top ? () => setSelected(hl.top!) : undefined}
        />
        <HighlightCard
          label="Customers with a loss"
          tone="bad"
          loading={fullLoading && !full}
          isEmpty={!hl || hl.losers.count === 0}
          emptyText="No customer gave a loss on these dates"
          primary={hl && plural(hl.losers.count, "customer", "customers")}
          amount={hl?.losers.total}
          amountLabel="total loss"
          sub={
            hl?.losers.worst && (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                Biggest: {hl.losers.worst.name}
                {hl.losers.worst.code && <CodeBadge code={hl.losers.worst.code} kind="customer" />}
                <SignedAmount value={hl.losers.worst.profit} plus={false} />
              </span>
            )
          }
          onClick={hl?.losers.worst ? () => setSelected(hl.losers.worst!) : undefined}
        />
      </div>

      {/* All-customer totals — equal to MIS gross profit for the range */}
      <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 sm:px-5" data-testid="cp-totals">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            {
              k: "Customers",
              v: t ? (
                <>
                  {t.customersWithActivity.toLocaleString("en-IN")}
                  <span className="text-sm font-normal text-slate-500"> of {t.customers.toLocaleString("en-IN")} bought or returned</span>
                </>
              ) : null,
            },
            { k: "Sales", term: "sales" as const, v: t && formatINRSmart(t.sales) },
            { k: "Cost (COGS)", term: "cost" as const, v: t && formatINRSmart(t.cost) },
            { k: "Returns", term: "returns" as const, v: t && formatINRSmart(t.returns) },
            {
              k: "Profit",
              term: "grossProfit" as const,
              v: t && <SignedAmount value={t.profit} plus={false} className="font-semibold" />,
              id: "cp-total-profit",
            },
            { k: "Margin", term: "margin" as const, v: t && <MarginBadge margin={t.margin} decimals={2} /> },
          ].map((c) => (
            <div key={c.k} className="min-w-0">
              <dt className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                {c.k}
                {c.term && <InfoTip term={c.term} />}
              </dt>
              <dd className="mt-0.5 text-base font-semibold tabular-nums text-slate-900" data-testid={c.id}>
                {fullLoading && !full ? (
                  <span className="block h-6 w-24 animate-pulse rounded bg-slate-100" aria-hidden />
                ) : (
                  c.v ?? "—"
                )}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 border-t border-slate-100 pt-2.5 text-xs leading-5 text-slate-500">
          Profit = Sales − Returns − Cost. Returns count on the day they came back. The total equals Gross
          profit on the Overview. Customers with no bills or returns on these dates are listed last, with “—”.
        </p>
      </section>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] max-w-sm flex-1">
          <span className="mb-1 block text-xs text-muted-foreground">Customer</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer name or code"
              className="pl-9"
              data-testid="cp-search"
            />
          </div>
        </div>
        <Button onClick={handleExport} disabled={!full} className="ml-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div ref={scroller} className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-slate-100">
            <tr className="border-b border-slate-200 text-xs text-slate-600">
              <th className="h-[45px] w-12 px-3 text-left font-medium">#</th>
              <th className="px-3 text-left font-medium">Customer</th>
              <th className="px-3 text-right font-medium">Bills</th>
              <th className="px-3 text-right font-medium">Sales</th>
              <th className="px-3 text-right font-medium">Cost (COGS)</th>
              <th className="px-3 text-right font-medium">Returns</th>
              <th className="px-3 text-right font-medium">Profit</th>
              <th className="px-3 text-right font-medium">Margin</th>
              <th className="w-8 px-3" />
            </tr>
          </thead>
          <tbody>
            {loading && <ListStatusRow status="loading" colSpan={COLS} search={debounced} />}
            {!loading && loadError && (
              <ListStatusRow status="error" colSpan={COLS} onRetry={() => setReload((n) => n + 1)} />
            )}
            {!loading && list && rows.length === 0 && (
              <EmptyRow
                colSpan={COLS}
                testId="list-status-empty"
                icon={q ? Search : Users}
                title={q ? `No results for “${q}”` : "No customers yet"}
                description={q ? "Check the spelling, or search by customer code (like C153)." : "Add a customer to see them here."}
                action={q ? { label: "Clear search", onClick: () => setSearch("") } : undefined}
              />
            )}
            {!loading &&
              rows.map((r, i) => (
                <CustomerRows
                  key={r.customerId}
                  r={r}
                  divider={!r.hasActivity && (i === 0 || rows[i - 1].hasActivity)}
                  idleCount={t ? t.customers - t.customersWithActivity : undefined}
                  onOpen={() => setSelected(r)}
                />
              ))}
          </tbody>
        </table>
      </div>

      {!loading && !loadError && pg && pg.totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground" data-testid="list-footer">
            Showing {(pg.currentPage - 1) * pg.limit + 1}–{Math.min(pg.currentPage * pg.limit, pg.totalItems)} of{" "}
            {plural(pg.totalItems, "customer", "customers")}
          </span>
          <DataPagination currentPage={page} totalPages={pg.totalPages} onPageChange={setPage} disabled={loading} />
        </div>
      )}

      <CustomerProfitDialog customer={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function CustomerRows({
  r,
  divider,
  idleCount,
  onOpen,
}: {
  r: CustomerProfitRow;
  divider: boolean;
  idleCount?: number;
  onOpen: () => void;
}) {
  const idle = !r.hasActivity;
  const dash = <span className="text-slate-300">—</span>;
  const td = "px-3 py-2.5";
  const num = "whitespace-nowrap text-right tabular-nums";
  return (
    <>
      {divider && (
        <tr data-testid="cp-idle-divider">
          <th colSpan={COLS} scope="colgroup" className="border-y border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-600">
            No bills or returns on these dates
            {idleCount !== undefined && <span className="ml-1.5 font-normal text-slate-500">· {plural(idleCount, "customer", "customers")}</span>}
          </th>
        </tr>
      )}
      <tr
        onClick={onOpen}
        className={cn(
          "cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80",
          idle && "text-slate-400"
        )}
        data-testid="cp-row"
        data-activity={idle ? "none" : "yes"}
      >
        <td className={cn(td, "tabular-nums text-slate-400")}>{r.rank}</td>
        <td className={td}>
          {/* Real button: keyboard users can open the drill-down too. */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="inline-flex max-w-full items-center gap-1.5 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <span className={cn("font-medium", idle ? "text-slate-500" : "text-slate-900")}>{r.name}</span>
            {r.code && <CodeBadge code={r.code} kind="customer" className={cn(idle && "opacity-70")} />}
          </button>
        </td>
        <td className={cn(td, num)}>{idle ? dash : r.bills}</td>
        <td className={cn(td, num, !idle && "text-slate-900")}>{idle ? dash : formatINRSmart(r.sales)}</td>
        <td className={cn(td, num, !idle && "text-slate-700")}>{idle ? dash : formatINRSmart(r.cost)}</td>
        <td className={cn(td, num, !idle && "text-slate-700")}>{idle || !r.returns ? dash : formatINRSmart(r.returns)}</td>
        <td className={cn(td, "text-right")}>{idle ? dash : <SignedAmount value={r.profit} plus={false} />}</td>
        <td className={cn(td, "text-right")}>{idle ? dash : <MarginBadge margin={r.margin} decimals={2} />}</td>
        <td className={cn(td, "text-slate-400")}>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </td>
      </tr>
    </>
  );
}

// ------------------------------------------------------------ drill-down
function CustomerProfitDialog({ customer, onClose }: { customer: Picked | null; onClose: () => void }) {
  const [period, setPeriod] = useState<PeriodValue>({ preset: "all" });
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<CustomerProfitDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [phone, setPhone] = useState<string>();
  const id = customer?.customerId;

  // Reset on close, so every open starts at "All time", page 1, no old rows.
  useEffect(() => {
    if (id) return;
    setPeriod({ preset: "all" });
    setPage(1);
    setDetail(null);
    setPhone(undefined);
  }, [id]);

  const changePeriod = (v: PeriodValue) => {
    setPeriod(v);
    setPage(1);
  };

  useEffect(() => {
    if (!id) return;
    let off = false;
    setLoading(true);
    setError(false);
    // All time = no dates: the server sends the whole history.
    const range = period.preset === "all" ? {} : periodToApiRange(period);
    getCustomerProfitDetail(id, range, { page, limit: DETAIL_PAGE_SIZE })
      .then((d) => !off && setDetail(d))
      .catch(() => {
        if (off) return;
        setDetail(null);
        setError(true);
      })
      .finally(() => !off && setLoading(false));
    return () => {
      off = true;
    };
  }, [id, period, page, retry]);

  useEffect(() => {
    if (!id) return;
    let off = false;
    getCustomerById(id)
      .then((res: any) => !off && setPhone(res?.data?.data?.phone || undefined))
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [id]);

  const s = detail?.summary;
  const pg = detail?.pagination;
  const entries = detail?.entries ?? [];
  const totals = s && {
    bills: s.bills,
    sales: s.sales,
    returns: s.returns,
    cost: s.cost,
    returnsCost: s.costBack,
    profit: s.profit,
    margin: s.margin,
  };
  const day = (d: string) => format(new Date(d), "d MMM yyyy");

  return (
    <Dialog open={!!customer} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-h-[92dvh] min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:max-w-4xl sm:p-6 [&>*]:min-w-0"
        data-testid="cp-detail"
      >
        <DialogHeader className="min-w-0 pr-6 text-left">
          <DialogTitle asChild>
            <div>
              <PartyTitle name={detail?.customer.name ?? customer?.name ?? ""} code={detail?.customer.code ?? customer?.code} phone={phone} />
            </div>
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            {s?.firstBillDate && s.lastBillDate
              ? s.firstBillDate === s.lastBillDate
                ? `Bill on ${day(s.firstBillDate)}`
                : `First bill ${day(s.firstBillDate)} · Last bill ${day(s.lastBillDate)}`
              : s
                ? "No bills in this period"
                : "Bills and returns, with the profit on each."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4">
          <PeriodFilter value={period} onChange={changePeriod} />

          {loading && !detail ? (
            <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded-md bg-slate-100 sm:w-28" />
              ))}
            </div>
          ) : totals ? (
            <ProfitSummaryChips totals={totals} />
          ) : null}

          <div className={cn("max-h-[55vh] min-w-0 overflow-auto rounded-lg border border-slate-200", loading && detail && "opacity-60")}>
            <table className="w-full min-w-[640px] text-sm">
              <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-slate-100">
                <ProfitEntryHead />
              </thead>
              <tbody>
                {loading &&
                  !detail &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-3 py-3">
                          <div className="h-4 animate-pulse rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))}
                {!loading && error && (
                  <ListStatusRow status="error" colSpan={6} onRetry={() => setRetry((n) => n + 1)} />
                )}
                {detail && entries.length === 0 && (
                  <EmptyRow
                    colSpan={6}
                    icon={Inbox}
                    title={period.preset === "all" ? "No bills or returns yet" : "No bills in this period"}
                    description={period.preset === "all" ? "This customer has not bought anything." : "Try All time or a longer period."}
                    action={period.preset === "all" ? undefined : { label: "Show all time", onClick: () => changePeriod({ preset: "all" }) }}
                  />
                )}
                {entries.map((e, i) => (
                  <ProfitEntryRow key={`${e.type}-${e.number}-${e.date}-${i}`} entry={e} />
                ))}
              </tbody>
              {detail && entries.length > 0 && totals && (
                <tfoot>
                  <ProfitTotalRow totals={totals} returnsCount={s?.returnsCount} />
                </tfoot>
              )}
            </table>
          </div>

          {pg && pg.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                Entries {(pg.currentPage - 1) * pg.limit + 1}–{Math.min(pg.currentPage * pg.limit, pg.totalItems)} of{" "}
                {pg.totalItems.toLocaleString("en-IN")} · Total covers all pages
              </span>
              <DataPagination currentPage={page} totalPages={pg.totalPages} onPageChange={setPage} disabled={loading} />
            </div>
          )}

          <p className="text-xs leading-5 text-slate-500">
            A return lowers profit by its value minus the cost of the goods that came back (“Cost back”).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

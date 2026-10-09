"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, BarChart3, Download, Inbox, Loader2, Scale, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataPagination from "@/components/DataPagination";
import ListStatusRow from "@/components/ListStatusRow";
import {
  CashBook as CashBookData,
  CashBookRow,
  CashMode,
  getCashBook,
} from "@/api/mis";
import { downloadCsv, rowsToCsv } from "@/utils/csv";
import { cn } from "@/lib/utils";
import {
  CodeBadge,
  DailyInOutChart,
  DayGroupRow,
  EmptyRow,
  MODE_META,
  ModeSplit,
  NetSentence,
  SignedAmount,
  StatCard,
  TypeTag,
  cashRowType,
  dailyInOutSeries,
  groupRowsByDay,
  type DayGroup,
} from "@/components/mis/ui";

// The table pages by whole days, so a day's header always adds up every row
// of that day (a busy day can be longer than any fixed row page).
const DAYS_PER_PAGE = 7;
const COLS = 6;

const MODE_LABEL: Record<CashMode, string> = {
  cash: "Cash",
  online: "Online",
  cheque: "Cheque",
  other: "Not recorded",
};

// Bill / receipt number to show; account payments have no bill.
const billNo = (r: CashBookRow) =>
  r.documentRef === "Sale" ||
  r.documentRef === "Purchase" ||
  r.documentRef === "Payment" ||
  r.documentRef === "Freight"
    ? r.documentNumber
    : "";

// Entries saved with a date only sit at local midnight: no time to show.
const timeOf = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0
    ? null
    : format(d, "h:mm a").toLowerCase();
};

const shortDay = (d: Date) => format(d, "d MMM");

export default function CashBook({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const [direction, setDirection] = useState<"all" | "in" | "out">("all");
  const [mode, setMode] = useState<"all" | CashMode>("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CashBookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0); // Retry
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Any filter change → back to page 1.
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, direction, mode, debounced]);

  // Every row for the dates + filters in ONE request (the same `all` path the
  // CSV export uses, capped on the server). Totals still come from the server.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    getCashBook({ startDate, endDate, direction, mode, search: debounced, all: true })
      .then((d) => !cancelled && setData(d))
      .catch(() => {
        if (cancelled) return;
        setData(null); // no stale rows / totals / page footer
        setLoadError(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, direction, mode, debounced, reload]);

  // New page → show its first day, not the middle of the scroller.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [page]);

  const groups = useMemo(() => groupRowsByDay(data?.rows ?? []), [data]);
  const series = useMemo(
    () => dailyInOutSeries(groups, { startDate, endDate }),
    [groups, startDate, endDate]
  );
  const totalPages = Math.max(1, Math.ceil(groups.length / DAYS_PER_PAGE));
  const pageGroups = groups.slice((page - 1) * DAYS_PER_PAGE, page * DAYS_PER_PAGE);
  const pageEntries = pageGroups.reduce((n, g) => n + g.count, 0);
  const truncated = !!data?.truncated;
  const lastKey = groups[groups.length - 1]?.key;

  const handleExport = async () => {
    setExporting(true);
    try {
      const all = await getCashBook({
        startDate,
        endDate,
        direction,
        mode,
        search: debounced,
        all: true,
      });
      if (!all.rows.length) {
        toast("No money in or out for these filters");
        return;
      }
      const rows = all.rows.map((r) => ({
        date: format(new Date(r.date), "yyyy-MM-dd"),
        inOut: r.direction === "in" ? "IN" : "OUT",
        party: r.party || "",
        partyCode: r.partyCode || "",
        mode: MODE_LABEL[r.mode],
        amount: r.amount,
        type: r.kind,
        billNo: billNo(r),
        reference: r.reference || "",
        notes: r.notes || "",
      }));
      const headers = ["date", "inOut", "party", "partyCode", "mode", "amount", "type", "billNo", "reference", "notes"];
      downloadCsv(rowsToCsv(rows, headers), `cash-book-${startDate}-to-${endDate}.csv`);
      toast.success(`Exported ${rows.length} row(s)`);
    } catch {
      /* API layer shows the error */
    } finally {
      setExporting(false);
    }
  };

  const t = data?.totals;
  const first = !data && loading; // nothing to show yet
  const plural = (n: number, one: string, many: string) =>
    `${n.toLocaleString("en-IN")} ${n === 1 ? one : many}`;

  return (
    <div className="space-y-4" data-testid="cash-book">
      {/* Totals: server totals for these dates + filters */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
          loading && data && "opacity-60 transition-opacity"
        )}
      >
        <StatCard
          title="Money in"
          info="moneyIn"
          icon={ArrowDownLeft}
          tone={t ? "in" : "neutral"}
          amount={t?.in.total}
          meta={t && plural(t.in.count, "payment", "payments")}
          sub="Received from customers"
          loading={first}
          data-testid="cash-total-in"
        >
          {t ? <ModeSplit split={t.in} /> : first ? <span /> : null}
        </StatCard>
        <StatCard
          title="Money out"
          info="moneyOut"
          icon={ArrowUpRight}
          tone={t ? "out" : "neutral"}
          amount={t?.out.total}
          meta={t && plural(t.out.count, "payment", "payments")}
          sub="Vendors, transporters and refunds"
          loading={first}
          data-testid="cash-total-out"
        >
          {t ? <ModeSplit split={t.out} /> : first ? <span /> : null}
        </StatCard>
        <StatCard
          title="Net (In − Out)"
          info="net"
          icon={Scale}
          tone="auto"
          amount={t?.net.total}
          sub={t ? <NetSentence net={t.net.total} /> : first ? "" : undefined}
          loading={first}
          className="md:col-span-2 xl:col-span-1"
          data-testid="cash-total-net"
        >
          {t ? <ModeSplit split={t.net} variant="signed" /> : first ? <span /> : null}
        </StatCard>
      </div>

      {/* Day-by-day chart: same rows as the table */}
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5" data-testid="cash-chart">
        <h2 className="mb-3 inline-flex items-center gap-2 text-base font-semibold text-slate-900">
          <BarChart3 className="h-4 w-4 text-slate-400" aria-hidden />
          Money in and out, day by day
        </h2>
        {loadError && !data ? (
          <p className="py-10 text-center text-sm text-slate-500">Could not load the chart. Use Retry below.</p>
        ) : (
          <DailyInOutChart data={series} loading={first} height={240} />
        )}
      </section>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <span className="mb-1 block text-xs text-muted-foreground">Show</span>
          <div className="inline-flex rounded-md border bg-white p-0.5" role="group">
            {(["all", "in", "out"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(d)}
                aria-pressed={direction === d}
                className={cn(
                  "h-9 rounded-[5px] px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98]",
                  direction === d
                    ? "bg-primary font-medium text-primary-foreground"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {d === "all" ? "All" : d === "in" ? "Money in" : "Money out"}
              </button>
            ))}
          </div>
        </div>
        <div className="w-40">
          <span className="mb-1 block text-xs text-muted-foreground">Mode</span>
          <Select value={mode} onValueChange={(v) => setMode(v as "all" | CashMode)}>
            <SelectTrigger aria-label="Mode" data-testid="cash-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modes</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="other">Not recorded</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[220px] max-w-sm flex-1">
          <span className="mb-1 block text-xs text-muted-foreground">Party / bill no.</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Customer, vendor or bill no."
              className="pl-9"
              data-testid="cash-search"
            />
          </div>
        </div>
        <Button onClick={handleExport} disabled={exporting} className="ml-auto">
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export CSV
        </Button>
      </div>

      {truncated && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-inset ring-amber-200" role="status">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Too many entries for one view: only the newest {data?.rows.length.toLocaleString("en-IN")} are shown,
          so the oldest day may be incomplete. Pick fewer days.
        </p>
      )}

      {/* Table, grouped by day */}
      <div
        ref={scroller}
        className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-white"
        data-testid="cash-table"
      >
        <table className="w-full min-w-[720px] text-sm">
          <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-slate-100">
            <tr className="border-b border-slate-200 text-xs text-slate-600">
              <th className="h-[45px] px-3 text-left font-medium">Time</th>
              <th className="px-3 text-left font-medium">Party</th>
              <th className="px-3 text-left font-medium">Type</th>
              <th className="px-3 text-left font-medium">Mode</th>
              <th className="px-3 text-right font-medium">Amount</th>
              <th className="px-3 text-left font-medium">Bill / Ref</th>
            </tr>
          </thead>
          <tbody>
            {loading && <ListStatusRow status="loading" colSpan={COLS} search={debounced} />}
            {!loading && loadError && (
              <ListStatusRow status="error" colSpan={COLS} onRetry={() => setReload((n) => n + 1)} />
            )}
            {!loading && data && groups.length === 0 && (
              <EmptyRow
                colSpan={COLS}
                testId="list-status-empty"
                icon={debounced.trim() ? Search : Inbox}
                title={
                  debounced.trim()
                    ? `No results for “${debounced.trim()}”`
                    : "No money in or out for these filters"
                }
                description={
                  debounced.trim()
                    ? "Check the spelling, or search by bill number."
                    : "Pick a longer date range, or set Show and Mode back to All."
                }
                action={
                  debounced.trim()
                    ? { label: "Clear search", onClick: () => setSearch("") }
                    : undefined
                }
              />
            )}
            {!loading &&
              pageGroups.map((g) => (
                <DayRows key={g.key} g={g} partial={truncated && g.key === lastKey} />
              ))}
          </tbody>
        </table>
      </div>

      {!loading && !loadError && groups.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground" data-testid="list-footer">
            {plural(pageEntries, "entry", "entries")} on {plural(pageGroups.length, "day", "days")}
            {pageGroups.length > 1
              ? ` (${shortDay(pageGroups[pageGroups.length - 1].date)} – ${shortDay(pageGroups[0].date)})`
              : ` (${shortDay(pageGroups[0].date)})`}
            {totalPages > 1 && ` · ${plural(data?.rows.length ?? 0, "entry", "entries")} in all`}
          </span>
          <DataPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={loading}
          />
        </div>
      )}
    </div>
  );
}

function DayRows({
  g,
  partial,
}: {
  g: DayGroup<CashBookRow>;
  partial?: boolean;
}) {
  return (
    <>
      <DayGroupRow colSpan={COLS} date={g.date} in={g.in} out={g.out} net={g.net} count={g.count} partial={partial} />
      {g.rows.map((r) => {
        const bill = billNo(r);
        const time = timeOf(r.date);
        const m = MODE_META[r.mode] ?? MODE_META.other;
        const type = cashRowType(r);
        return (
          <tr
            key={r._id}
            className={cn(
              "border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60",
              type === "refund" && "bg-rose-50/50"
            )}
            data-testid="cash-row"
          >
            <td className="whitespace-nowrap px-3 py-2.5 text-[13px] tabular-nums text-slate-500">
              {time ?? <span className="text-slate-300" title="Saved with a date only">—</span>}
            </td>
            <td className="px-3 py-2.5">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-slate-900">{r.party || "—"}</span>
                {r.partyCode && <CodeBadge code={r.partyCode} />}
              </span>
            </td>
            <td className="px-3 py-2.5">
              {/* Full wording ("Refund – SO891 cancelled") on hover. */}
              <span title={r.kind}>
                <TypeTag type={type} />
              </span>
            </td>
            <td className="px-3 py-2.5">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-slate-600">
                <m.Icon className={cn("h-3.5 w-3.5", m.icon)} aria-hidden />
                {MODE_LABEL[r.mode]}
              </span>
            </td>
            <td className="px-3 py-2.5 text-right">
              <SignedAmount value={r.amount} direction={r.direction} />
            </td>
            <td className="px-3 py-2.5">
              <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                {bill ? <CodeBadge code={bill} /> : !r.reference && <span className="text-slate-300">—</span>}
                {r.reference && r.reference !== bill && (
                  <span className="text-xs text-slate-500">Ref {r.reference}</span>
                )}
              </span>
            </td>
          </tr>
        );
      })}
    </>
  );
}

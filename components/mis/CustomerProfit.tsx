"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ChevronRight, Download, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DataPagination from "@/components/DataPagination";
import { formatLongDate } from "@/components/ui/DatePicker";
import {
  CustomerProfit as CustomerProfitData,
  CustomerProfitDetail,
  CustomerProfitRow,
  getCustomerProfit,
  getCustomerProfitDetail,
} from "@/api/mis";
import { formatINR } from "@/utils/format";
import { downloadCsv, rowsToCsv } from "@/utils/csv";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const marginText = (m: number | null) => (m === null ? "—" : `${m.toFixed(2)}%`);
const tone = (n: number) => (n >= 0 ? "text-emerald-600" : "text-red-600");
const shortDay = (s: string) => format(new Date(`${s}T00:00:00`), "d MMM yyyy");

export default function CustomerProfit({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const [data, setData] = useState<CustomerProfitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CustomerProfitRow | null>(null);
  const [detail, setDetail] = useState<CustomerProfitDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCustomerProfit(startDate, endDate)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  useEffect(() => setPage(1), [search, startDate, endDate]);

  // Rank is the position in the full list (by profit), kept while searching.
  const ranked = useMemo(
    () => (data?.rows || []).map((r, i) => ({ ...r, rank: i + 1 })),
    [data]
  );
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? ranked.filter((r) => `${r.name} ${r.code}`.toLowerCase().includes(q))
      : ranked;
  }, [ranked, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openDetail = async (row: CustomerProfitRow) => {
    setSelected(row);
    setDetail(null);
    setDetailLoading(true);
    try {
      setDetail(await getCustomerProfitDetail(row.customerId, startDate, endDate));
    } catch {
      /* API layer shows the error */
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExport = () => {
    if (!data || !data.rows.length) {
      toast("No customer sales in this date range");
      return;
    }
    const rows: Record<string, unknown>[] = ranked.map((r) => ({
      rank: r.rank,
      customer: r.name,
      code: r.code,
      bills: r.bills,
      sales: r.sales,
      cost: r.cost,
      returns: r.returns,
      profit: r.profit,
      marginPct: r.margin ?? "",
    }));
    const t = data.totals;
    rows.push({
      rank: "",
      customer: "TOTAL (all customers)",
      code: "",
      bills: t.bills,
      sales: t.sales,
      cost: t.cost,
      returns: t.returns,
      profit: t.profit,
      marginPct: t.margin ?? "",
    });
    const headers = ["rank", "customer", "code", "bills", "sales", "cost", "returns", "profit", "marginPct"];
    downloadCsv(rowsToCsv(rows, headers), `customer-profit-${startDate}-to-${endDate}.csv`);
    toast.success(`Exported ${ranked.length} customer(s)`);
  };

  const t = data?.totals;

  return (
    <div className="space-y-4" data-testid="customer-profit">
      {/* All-customer totals — equal to MIS gross profit for the range */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Customers</div>
              <div className="text-lg font-semibold">{t ? t.customers : "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Sales</div>
              <div className="text-lg font-semibold">{t ? formatINR(t.sales) : "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Cost (COGS)</div>
              <div className="text-lg font-semibold">{t ? formatINR(t.cost) : "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Returns</div>
              <div className="text-lg font-semibold">{t ? formatINR(t.returns) : "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Profit</div>
              <div className={cn("text-lg font-semibold", t && tone(t.profit))} data-testid="cp-total-profit">
                {t ? formatINR(t.profit) : "—"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Margin</div>
              <div className="text-lg font-semibold">{t ? marginText(t.margin) : "—"}</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Profit = Sales − Returns − Cost. Cost is what the goods cost when
            sold, minus the cost of goods that came back. Returns count on the
            day they came back. The total equals Gross Profit on the Overview.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px] max-w-sm">
          <span className="text-xs text-muted-foreground block mb-1">Customer</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer name or code"
              className="pl-9"
              data-testid="cp-search"
            />
          </div>
        </div>
        <Button onClick={handleExport} className="ml-auto">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border bg-white overflow-auto max-h-[70vh]">
        <table className="w-full text-sm">
          <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-muted">
            <tr className="border-b">
              <th className="p-3 text-left font-medium w-12">#</th>
              <th className="p-3 text-left font-medium">Customer</th>
              <th className="p-3 text-right font-medium">Bills</th>
              <th className="p-3 text-right font-medium">Sales</th>
              <th className="p-3 text-right font-medium">Cost (COGS)</th>
              <th className="p-3 text-right font-medium">Returns</th>
              <th className="p-3 text-right font-medium">Profit</th>
              <th className="p-3 text-right font-medium">Margin</th>
              <th className="p-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {loading && !data && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            )}
            {data && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-muted-foreground">
                  {search ? `No customer matches "${search}"` : "No customer sales in this date range."}
                </td>
              </tr>
            )}
            {pageRows.map((r) => (
              <tr
                key={r.customerId}
                onClick={() => openDetail(r)}
                className={cn(
                  "border-b last:border-b-0 cursor-pointer hover:bg-slate-50",
                  loading && "opacity-60"
                )}
                data-testid="cp-row"
              >
                <td className="p-3 text-muted-foreground">{r.rank}</td>
                <td className="p-3">
                  <span className="font-medium">{r.name}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{r.code}</span>
                </td>
                <td className="p-3 text-right">{r.bills}</td>
                <td className="p-3 text-right whitespace-nowrap">{formatINR(r.sales)}</td>
                <td className="p-3 text-right whitespace-nowrap">{formatINR(r.cost)}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  {r.returns ? formatINR(r.returns) : "—"}
                </td>
                <td className={cn("p-3 text-right font-medium whitespace-nowrap", tone(r.profit))}>
                  {formatINR(r.profit)}
                </td>
                <td className={cn("p-3 text-right", r.margin !== null && tone(r.margin))}>
                  {marginText(r.margin)}
                </td>
                <td className="p-3 text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          {filtered.length > 0
            ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} customer(s)`
            : ""}
        </span>
        <DataPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Drill-down: the customer's bills and returns in the range */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-4xl" data-testid="cp-detail">
          <DialogHeader>
            <DialogTitle>
              {selected?.name}{" "}
              <span className="text-sm font-normal text-muted-foreground">{selected?.code}</span>
            </DialogTitle>
            <DialogDescription>
              Bills and returns from {shortDay(startDate)} to {shortDay(endDate)}.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-muted">
                <tr className="border-b">
                  <th className="p-2 text-left font-medium">Date</th>
                  <th className="p-2 text-left font-medium">Bill / Return</th>
                  <th className="p-2 text-right font-medium">Sales</th>
                  <th className="p-2 text-right font-medium">Cost</th>
                  <th className="p-2 text-right font-medium">Returns</th>
                  <th className="p-2 text-right font-medium">Profit</th>
                </tr>
              </thead>
              <tbody>
                {detailLoading && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                )}
                {detail?.entries.map((e, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="p-2 whitespace-nowrap">{formatLongDate(new Date(e.date))}</td>
                    <td className="p-2">
                      {e.type === "bill" ? (
                        <span className="font-medium">{e.number}</span>
                      ) : e.type === "sale-return" ? (
                        <span>Return on {e.number}</span>
                      ) : (
                        <span>
                          {e.number}{" "}
                          <span className="text-xs text-muted-foreground">(return, no bill)</span>
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-right whitespace-nowrap">{e.sales ? formatINR(e.sales) : "—"}</td>
                    <td className="p-2 text-right whitespace-nowrap">{formatINR(e.cost)}</td>
                    <td className="p-2 text-right whitespace-nowrap">{e.returns ? formatINR(e.returns) : "—"}</td>
                    <td className={cn("p-2 text-right font-medium whitespace-nowrap", tone(e.profit))}>
                      {formatINR(e.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {detail && (
                <tfoot>
                  <tr className="border-t bg-muted/50 font-semibold">
                    <td className="p-2" colSpan={2}>
                      Total ({detail.totals.bills} bill(s))
                    </td>
                    <td className="p-2 text-right whitespace-nowrap">{formatINR(detail.totals.sales)}</td>
                    <td className="p-2 text-right whitespace-nowrap">{formatINR(detail.totals.cost)}</td>
                    <td className="p-2 text-right whitespace-nowrap">{formatINR(detail.totals.returns)}</td>
                    <td className={cn("p-2 text-right whitespace-nowrap", tone(detail.totals.profit))} data-testid="cp-detail-profit">
                      {formatINR(detail.totals.profit)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            A return lowers profit by (value − cost of the goods that came back).
            Margin for {selected?.name}: {detail ? marginText(detail.totals.margin) : "—"}.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

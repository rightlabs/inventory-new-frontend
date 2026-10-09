"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import DataPagination from "@/components/DataPagination";
import ListStatusRow from "@/components/ListStatusRow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  IndianRupee,
  TrendingUp,
  ShoppingCart,
  Package,
  Percent,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  CircleDollarSign,
  Undo2,
  Wallet,
  Receipt,
  LayoutGrid,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import { format, parse } from "date-fns";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/userContext";
import {
  getMisSummary,
  getMisSalesExport,
  getCashBook,
  MisSummary,
  CashSplit,
} from "@/api/mis";
import { getSales } from "@/api/sale";
import { formatINRShort, formatINRSmart } from "@/utils/formatSmart";
import {
  CodeBadge,
  DateCell,
  EmptyRow,
  MarginBadge,
  SignedAmount,
  StatCard,
  type StatCardProps,
} from "@/components/mis/ui";
import { downloadCsv, rowsToCsv } from "@/utils/csv";
import DateRangeBar, { presetRange } from "@/components/mis/DateRangeBar";
import CashBook from "@/components/mis/CashBook";
import CustomerProfit from "@/components/mis/CustomerProfit";

const PAGE_SIZE = 10;

const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-IN").format(n || 0);

const STATUS_BADGE: Record<
  string,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  delivered: {
    label: "Delivered",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    Icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    className:
      "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    Icon: Clock,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    Icon: XCircle,
  },
};

const PAYMENT_BADGE: Record<
  string,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  paid: {
    label: "Paid",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    Icon: CircleDollarSign,
  },
  partial: {
    label: "Partial",
    className:
      "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    Icon: Clock,
  },
  unpaid: {
    label: "Unpaid",
    className: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    Icon: AlertCircle,
  },
};

function Badge({
  value,
  map,
}: {
  value: string;
  map: typeof STATUS_BADGE;
}) {
  const cfg = map[value] || {
    label: value,
    className: "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200",
    Icon: AlertCircle,
  };
  const { Icon } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cfg.className}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

interface SaleRow {
  _id: string;
  saleNumber: string;
  date: string;
  customer: { _id: string; name: string; gstin?: string };
  grandTotal: number;
  discount: number;
  balanceAmount: number;
  status: string;
  paymentStatus: string;
}

// MIS shows profit: admin only (Oct 2026 owner rule). A sales user who opens
// /analytics by URL goes to /sales; the backend /mis routes also return 401.
export default function AnalyticsPage() {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/sales");
  }, [user, router]);

  if (user?.role !== "admin")
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );

  return <AnalyticsContent />;
}

function AnalyticsContent() {
  // Default range: last 30 days (incl. today) — same as the "30 days" button.
  const [startDate, setStartDate] = useState(() => presetRange(30).start);
  const [endDate, setEndDate] = useState(() => presetRange(30).end);
  const [tab, setTab] = useState("overview");

  const [summary, setSummary] = useState<MisSummary | null>(null);
  const [moneyIn, setMoneyIn] = useState<CashSplit | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [sales, setSales] = useState<SaleRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState(false);
  const latestSalesRequest = useRef(0); // ignore out-of-order responses

  const [exporting, setExporting] = useState(false);

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const [res, cash] = await Promise.all([
        getMisSummary(startDate, endDate),
        getCashBook({ startDate, endDate, limit: 1 }),
      ]);
      setSummary(res.data);
      setMoneyIn(cash.totals.in);
    } catch (err: any) {
      // Never leave the previous range's figures under the new dates.
      setSummary(null);
      setMoneyIn(null);
      toast.error(err?.message || "Failed to load MIS summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchSales = async (targetPage = page) => {
    const requestId = ++latestSalesRequest.current;
    setSalesLoading(true);
    setSalesError(false);
    try {
      const res = await getSales({
        page: targetPage,
        limit: PAGE_SIZE,
        startDate,
        endDate,
      });
      if (requestId !== latestSalesRequest.current) return;
      const payload = res?.data?.data;
      setSales(payload?.sales || []);
      setTotalPages(payload?.pagination?.totalPages || 1);
      setTotalItems(payload?.pagination?.totalItems || 0);
    } catch (err: any) {
      if (requestId !== latestSalesRequest.current) return;
      setSales([]);
      setTotalPages(1);
      setTotalItems(0);
      setSalesError(true);
      toast.error(err?.message || "Failed to load sales");
    } finally {
      if (requestId === latestSalesRequest.current) setSalesLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchSummary();
    fetchSales(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  useEffect(() => {
    fetchSales(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await getMisSalesExport(startDate, endDate);
      const rows = res.data.rows;
      if (!rows || rows.length === 0) {
        toast("No sales in this date range to export");
        return;
      }
      const headers = [
        "saleNumber",
        "date",
        "customer",
        "gstin",
        "phone",
        "status",
        "paymentStatus",
        "itemName",
        "itemType",
        "quantity",
        "weight",
        "rate",
        "sellingPrice",
        "itemAmount",
        "subtotal",
        "discountAmount",
        "additionalCharges",
        "grandTotal",
        "totalPaid",
        "balance",
        "paymentModes",
      ];
      const csv = rowsToCsv(rows as unknown as Record<string, unknown>[], headers);
      downloadCsv(csv, `sales-${startDate}-to-${endDate}.csv`);
      toast.success(`Exported ${rows.length} row(s)`);
      if (res.data.truncated) {
        toast("Export was truncated at the server limit — narrow the range.", {
          icon: "⚠️",
        });
      }
    } catch (err: any) {
      toast.error(err?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const kpis = summary?.kpis;

  // Same 8 figures as before; only how they read changed (kit StatCard).
  const kpiCards: (StatCardProps & { key: string })[] = useMemo(() => {
    const k = kpis;
    const n = (v: number, one: string, many: string) =>
      `${formatNumber(v)} ${v === 1 ? one : many}`;
    return [
      {
        key: "sales",
        title: "Sales",
        info: "sales",
        icon: IndianRupee,
        amount: k?.totalRevenue,
        meta: k && n(k.salesCount, "bill", "bills"),
        sub: "After returns",
      },
      {
        key: "cogs",
        title: "Cost (COGS)",
        info: "cost",
        icon: Package,
        amount: k?.totalCogs,
        sub: "Less goods returned",
      },
      {
        key: "profit",
        title: "Gross profit",
        info: "grossProfit",
        icon: TrendingUp,
        amount: k?.grossProfit,
        tone: "auto",
        sub: k && (
          <span className="inline-flex items-center gap-1.5">
            Margin <MarginBadge margin={k.grossMargin} decimals={2} />
          </span>
        ),
      },
      {
        key: "returns",
        title: "Returns",
        info: "returns",
        icon: Undo2,
        amount: k?.returnsValue,
        meta: k && n(k.returnsCount, "return", "returns"),
        sub: k && `Cost ${formatINRSmart(k.returnsCost)} back in stock`,
      },
      {
        key: "moneyIn",
        title: "Money in",
        info: "moneyIn",
        icon: Wallet,
        amount: moneyIn?.total,
        tone: "in",
        meta: moneyIn && n(moneyIn.count, "payment", "payments"),
        sub: "From customers (see Cash Book)",
      },
      {
        key: "purchases",
        title: "Purchases",
        info: "purchases",
        icon: ShoppingCart,
        amount: k?.totalPurchases,
        meta: k && n(k.purchaseCount, "order", "orders"),
        sub: "Purchase orders in these dates",
      },
      {
        key: "avg",
        title: "Avg. sale value",
        info: "avgSale",
        icon: Receipt,
        amount: k?.avgOrderValue,
        sub: "Per bill",
      },
      {
        key: "discount",
        title: "Discounts given",
        info: "discount",
        icon: Percent,
        amount: k?.totalDiscount,
        sub: "On bills in these dates",
      },
    ];
  }, [kpis, moneyIn]);

  return (
    <div className="space-y-6">
      {/* Header + Date Range */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MIS Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revenue, profit, money in / out and profit per customer — filtered
            by date.
          </p>
        </div>
        <DateRangeBar
          startDate={startDate}
          endDate={endDate}
          onChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
          }}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cash">Cash Book</TabsTrigger>
            <TabsTrigger value="customers">Customer Profit</TabsTrigger>
          </TabsList>
          {tab === "overview" && (
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export Sales CSV
            </Button>
          )}
        </div>

        <TabsContent value="cash" className="mt-0">
          <CashBook startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="customers" className="mt-0">
          <CustomerProfit startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="overview" className="mt-0 space-y-6">
      {/* KPI Grid: 4 a row on wide screens, 2 on tablets, 1 on phones */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="mis-kpis">
        {kpiCards.map(({ key, ...card }) => (
          <StatCard
            key={key}
            size="md"
            loading={summaryLoading}
            data-testid={`kpi-${key}`}
            {...card}
          />
        ))}
      </div>

      {/* Category Breakdown */}
      <section className="rounded-xl border border-slate-200 bg-white" data-testid="mis-categories">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 pt-4 sm:px-5 sm:pt-5">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
            <LayoutGrid className="h-4 w-4 text-slate-400" aria-hidden />
            Category performance
          </h2>
          <p className="text-[13px] text-slate-500">
            After returns, counted on the day goods came back.
          </p>
        </header>
        <div className="mt-3 max-h-[70vh] overflow-auto border-t border-slate-200">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-slate-100">
              <tr className="border-b border-slate-200 text-xs text-slate-600">
                <th className="h-[45px] px-4 text-left font-medium sm:px-5">Category</th>
                <th className="px-3 text-right font-medium">Items sold</th>
                <th className="px-3 text-right font-medium">Revenue</th>
                <th className="px-3 text-right font-medium">Returns</th>
                <th className="px-3 text-right font-medium">COGS</th>
                <th className="px-3 text-right font-medium">Profit</th>
                <th className="px-4 text-right font-medium sm:px-5">Margin</th>
              </tr>
            </thead>
            <tbody>
              {!summary &&
                summaryLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-3 py-3 first:px-4 sm:first:px-5">
                        <div className="ml-auto h-4 w-20 animate-pulse rounded bg-slate-100 first:ml-0" />
                      </td>
                    ))}
                  </tr>
                ))}
              {summary && summary.categoryBreakdown.length === 0 && (
                <EmptyRow
                  colSpan={7}
                  title="No sales on these dates"
                  description="Pick a longer date range above."
                />
              )}
              {(summary?.categoryBreakdown || []).map((c) => (
                <tr key={c.category} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-medium capitalize text-slate-900 sm:px-5">{c.category}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{formatNumber(c.count)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-900">
                    {formatINRSmart(c.revenue)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-700">
                    {c.returns ? formatINRSmart(c.returns) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-700">
                    {formatINRSmart(c.cogs)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <SignedAmount value={c.profit} plus={false} />
                  </td>
                  <td className="px-4 py-2.5 text-right sm:px-5">
                    <MarginBadge margin={c.margin} decimals={2} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Daily trend */}
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5" data-testid="mis-daily">
        <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
            <TrendingUp className="h-4 w-4 text-slate-400" aria-hidden />
            Daily sales vs purchases
          </h2>
          <p className="text-[13px] text-slate-500">
            Sales leave out cancelled bills and are after customer returns.
          </p>
        </header>
        <div className="h-[300px]">
          {summary && summary.dailySeries.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 px-6 text-center">
              <p className="text-sm font-medium text-slate-700">No sales or purchases on these dates</p>
              <p className="mt-0.5 text-xs text-slate-500">Pick a longer date range above.</p>
            </div>
          ) : !summary && summaryLoading ? (
            <div className="h-full animate-pulse rounded-lg bg-slate-50" aria-hidden />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.dailySeries || []} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="#EEF2F6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => format(parse(d, "yyyy-MM-dd", new Date()), "d MMM")}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={16}
                />
                <YAxis
                  width={56}
                  tickFormatter={(v: number) => formatINRShort(v)}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number) => formatINRSmart(value)}
                  labelFormatter={(d: string) => format(parse(d, "yyyy-MM-dd", new Date()), "EEE, d MMM yyyy")}
                  contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 13 }}
                />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: 13 }} />
                <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} dot={false} name="Sales" />
                <Line type="monotone" dataKey="purchases" stroke="#D97706" strokeWidth={2} dot={false} name="Purchases" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Sales Orders Table */}
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5" data-testid="mis-sales">
        <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
            <Receipt className="h-4 w-4 text-slate-400" aria-hidden />
            Sales orders
          </h2>
          <p className="text-[13px] text-slate-500">
            {formatNumber(totalItems)} {totalItems === 1 ? "order" : "orders"} on these dates · page {page} of {totalPages}
          </p>
        </header>
        <div>
          <div className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-slate-100 [&_th]:text-xs [&_th]:text-slate-600">
                <tr className="border-b border-slate-200">
                  <th className="p-3 text-left font-medium">#</th>
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Customer</th>
                  <th className="p-3 text-right font-medium">Grand Total</th>
                  <th className="p-3 text-right font-medium">Balance</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Payment</th>
                </tr>
              </thead>
              <tbody>
                {salesLoading && <ListStatusRow status="loading" colSpan={7} />}
                {!salesLoading && salesError && (
                  <ListStatusRow status="error" colSpan={7} onRetry={() => fetchSales(page)} />
                )}
                {!salesLoading && !salesError && sales.length === 0 && (
                  <ListStatusRow status="empty" colSpan={7} emptyText="No sales in this range." />
                )}
                {!salesLoading &&
                  sales.map((s) => (
                    <tr key={s._id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                      <td className="p-3"><CodeBadge code={s.saleNumber} kind="sale" /></td>
                      <td className="p-3">
                        <DateCell date={s.date} hint="none" />
                      </td>
                      <td className="p-3 text-slate-900">{s.customer?.name || "—"}</td>
                      <td className="p-3 text-right tabular-nums whitespace-nowrap">
                        {formatINRSmart(s.grandTotal)}
                      </td>
                      <td className="p-3 text-right tabular-nums whitespace-nowrap">
                        {formatINRSmart(s.balanceAmount)}
                      </td>
                      <td className="p-3">
                        <Badge value={s.status} map={STATUS_BADGE} />
                      </td>
                      <td className="p-3">
                        <Badge value={s.paymentStatus} map={PAYMENT_BADGE} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!salesLoading && !salesError && totalItems > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 text-sm">
            <span className="text-muted-foreground" data-testid="list-footer">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, totalItems)} of{" "}
              {formatNumber(totalItems)}
            </span>
            <DataPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
              disabled={salesLoading}
            />
          </div>
          )}
        </div>
      </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

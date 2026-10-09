"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import DataPagination from "@/components/DataPagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { formatAxisINR, formatINR } from "@/utils/format";
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
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [sales, setSales] = useState<SaleRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [salesLoading, setSalesLoading] = useState(false);

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
      toast.error(err?.message || "Failed to load MIS summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchSales = async (targetPage = page) => {
    setSalesLoading(true);
    try {
      const res = await getSales({
        page: targetPage,
        limit: PAGE_SIZE,
        startDate,
        endDate,
      });
      const payload = res?.data?.data;
      setSales(payload?.sales || []);
      setTotalPages(payload?.pagination?.totalPages || 1);
      setTotalItems(payload?.pagination?.totalItems || 0);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load sales");
    } finally {
      setSalesLoading(false);
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

  const kpiCards = useMemo(() => {
    if (!kpis) return [];
    return [
      {
        label: "Total Revenue",
        value: formatINR(kpis.totalRevenue),
        icon: IndianRupee,
        tone: "text-primary",
        sub: `${formatNumber(kpis.salesCount)} sale(s), after returns`,
      },
      {
        label: "Gross Profit",
        value: formatINR(kpis.grossProfit),
        icon: TrendingUp,
        tone: kpis.grossProfit >= 0 ? "text-emerald-600" : "text-red-600",
        sub: `Margin ${kpis.grossMargin.toFixed(2)}%`,
      },
      {
        label: "COGS",
        value: formatINR(kpis.totalCogs),
        icon: Package,
        tone: "text-slate-600",
        sub: "Cost of goods sold, less goods returned",
      },
      {
        label: "Returns",
        value: formatINR(kpis.returnsValue),
        icon: Undo2,
        tone: "text-amber-600",
        sub: `${formatNumber(kpis.returnsCount)} return(s) · cost ${formatINR(
          kpis.returnsCost
        )} back in stock`,
      },
      {
        label: "Money Received",
        value: moneyIn ? formatINR(moneyIn.total) : "—",
        icon: Wallet,
        tone: "text-emerald-600",
        sub: "From customers (see Cash Book)",
      },
      {
        label: "Purchases",
        value: formatINR(kpis.totalPurchases),
        icon: ShoppingCart,
        tone: "text-slate-600",
        sub: `${formatNumber(kpis.purchaseCount)} order(s)`,
      },
      {
        label: "Avg. Sale Value",
        value: formatINR(kpis.avgOrderValue),
        icon: IndianRupee,
        tone: "text-slate-600",
        sub: "Per sale order",
      },
      {
        label: "Discounts Given",
        value: formatINR(kpis.totalDiscount),
        icon: Percent,
        tone: "text-slate-600",
        sub: "Total in range",
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
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryLoading && !summary && (
          <Card>
            <CardContent className="pt-6 text-muted-foreground">
              Loading summary...
            </CardContent>
          </Card>
        )}
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    {card.label}
                  </span>
                  <Icon className={`h-5 w-5 ${card.tone}`} />
                </div>
                <div className={`text-2xl font-semibold ${card.tone}`}>
                  {card.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {card.sub}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
          <CardDescription>
            Item-level revenue and margin per category in the selected range.
            Revenue and COGS are after returns (counted on the return day).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary && summary.categoryBreakdown.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No sales in this range.
            </div>
          ) : (
            <div className="rounded-md border overflow-auto max-h-[70vh]">
              <table className="w-full text-sm">
                <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-muted">
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Category</th>
                    <th className="p-3 text-right font-medium">Items Sold</th>
                    <th className="p-3 text-right font-medium">Revenue</th>
                    <th className="p-3 text-right font-medium">Returns</th>
                    <th className="p-3 text-right font-medium">COGS</th>
                    <th className="p-3 text-right font-medium">Profit</th>
                    <th className="p-3 text-right font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {(summary?.categoryBreakdown || []).map((c) => (
                    <tr key={c.category} className="border-b last:border-b-0">
                      <td className="p-3 capitalize">{c.category}</td>
                      <td className="p-3 text-right">{formatNumber(c.count)}</td>
                      <td className="p-3 text-right">
                        {formatINR(c.revenue)}
                      </td>
                      <td className="p-3 text-right">
                        {c.returns ? formatINR(c.returns) : "—"}
                      </td>
                      <td className="p-3 text-right">
                        {formatINR(c.cogs)}
                      </td>
                      <td
                        className={`p-3 text-right ${
                          c.profit >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {formatINR(c.profit)}
                      </td>
                      <td
                        className={`p-3 text-right ${
                          c.margin >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {c.margin.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue vs Purchases</CardTitle>
          <CardDescription>
            Day-by-day view of sales (excluding cancelled, after customer
            returns) and purchases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            {summary && summary.dailySeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No activity in this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary?.dailySeries || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                  <YAxis width={88} tickFormatter={formatAxisINR} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => formatINR(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#7C3AED"
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="purchases"
                    stroke="#EDC53A"
                    name="Purchases"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sales Orders</CardTitle>
              <CardDescription>
                {formatNumber(totalItems)} order(s) in range — page {page} of{" "}
                {totalPages}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto max-h-[70vh]">
            <table className="w-full text-sm">
              <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-muted">
                <tr className="border-b bg-muted/50">
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
                {salesLoading && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                )}
                {!salesLoading && sales.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      No sales in this range.
                    </td>
                  </tr>
                )}
                {!salesLoading &&
                  sales.map((s) => (
                    <tr key={s._id} className="border-b last:border-b-0">
                      <td className="p-3 font-medium">{s.saleNumber}</td>
                      <td className="p-3">
                        {new Date(s.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="p-3">{s.customer?.name || "—"}</td>
                      <td className="p-3 text-right">
                        {formatINR(s.grandTotal)}
                      </td>
                      <td className="p-3 text-right">
                        {formatINR(s.balanceAmount)}
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
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 text-sm">
            <span className="text-muted-foreground">
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
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

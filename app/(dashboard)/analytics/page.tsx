"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Download,
  IndianRupee,
  TrendingUp,
  ShoppingCart,
  Package,
  Percent,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  CircleDollarSign,
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
import { getMisSummary, getMisSalesExport, MisSummary } from "@/api/mis";
import { getSales } from "@/api/sale";

const PAGE_SIZE = 10;

// YYYY-MM-DD in local time (not UTC, which shifts by timezone).
const toDateInput = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-IN").format(n || 0);

const csvEscape = (v: unknown) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const rowsToCsv = (rows: Record<string, unknown>[], headers: string[]) => {
  const head = headers.map(csvEscape).join(",");
  const body = rows
    .map((r) => headers.map((h) => csvEscape(r[h])).join(","))
    .join("\n");
  return head + "\n" + body;
};

const downloadCsv = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

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

export default function AnalyticsPage() {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [startDate, setStartDate] = useState(toDateInput(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(toDateInput(today));

  const [summary, setSummary] = useState<MisSummary | null>(null);
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
      const res = await getMisSummary(startDate, endDate);
      setSummary(res.data);
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
        value: formatCurrency(kpis.totalRevenue),
        icon: IndianRupee,
        tone: "text-primary",
        sub: `${formatNumber(kpis.salesCount)} sale(s)`,
      },
      {
        label: "Gross Profit",
        value: formatCurrency(kpis.grossProfit),
        icon: TrendingUp,
        tone: kpis.grossProfit >= 0 ? "text-emerald-600" : "text-red-600",
        sub: `Margin ${kpis.grossMargin.toFixed(2)}%`,
      },
      {
        label: "COGS",
        value: formatCurrency(kpis.totalCogs),
        icon: Package,
        tone: "text-slate-600",
        sub: "Cost of goods sold",
      },
      {
        label: "Purchases",
        value: formatCurrency(kpis.totalPurchases),
        icon: ShoppingCart,
        tone: "text-slate-600",
        sub: `${formatNumber(kpis.purchaseCount)} order(s)`,
      },
      {
        label: "Avg. Sale Value",
        value: formatCurrency(kpis.avgOrderValue),
        icon: IndianRupee,
        tone: "text-slate-600",
        sub: "Per sale order",
      },
      {
        label: "Discounts Given",
        value: formatCurrency(kpis.totalDiscount),
        icon: Percent,
        tone: "text-slate-600",
        sub: "Total in range",
      },
    ];
  }, [kpis]);

  return (
    <div className="space-y-6">
      {/* Header + Date Range */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MIS Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revenue, profit, and orders — filtered by date range.
          </p>
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              From
            </label>
            <Input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              To
            </label>
            <Input
              type="date"
              value={endDate}
              min={startDate}
              max={toDateInput(today)}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary && summary.categoryBreakdown.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No sales in this range.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Category</th>
                    <th className="p-3 text-right font-medium">Items Sold</th>
                    <th className="p-3 text-right font-medium">Revenue</th>
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
                        {formatCurrency(c.revenue)}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(c.cogs)}
                      </td>
                      <td
                        className={`p-3 text-right ${
                          c.profit >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(c.profit)}
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
            Day-by-day view of sales (excluding cancelled) and purchases.
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
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
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
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
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
                        {formatCurrency(s.grandTotal)}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(s.balanceAmount)}
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
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, totalItems)} of{" "}
              {formatNumber(totalItems)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || salesLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || salesLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

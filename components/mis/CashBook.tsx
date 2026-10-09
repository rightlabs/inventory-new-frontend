"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Download, Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataPagination from "@/components/DataPagination";
import { formatLongDate } from "@/components/ui/DatePicker";
import {
  CashBook as CashBookData,
  CashBookRow,
  CashMode,
  CashSplit,
  getCashBook,
} from "@/api/mis";
import { formatINR } from "@/utils/format";
import { downloadCsv, rowsToCsv } from "@/utils/csv";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

const MODE_LABEL: Record<CashMode, string> = {
  cash: "Cash",
  online: "Online",
  cheque: "Cheque",
  other: "Not recorded",
};

// "= Cash ₹20,000.00 + Online ₹25,000.00 + Cheque ₹5,000.00"
const splitText = (s: CashSplit) => {
  const parts = (["cash", "online", "cheque", "other"] as CashMode[])
    .filter((m) => m !== "other" || s.other !== 0)
    .map((m) => `${MODE_LABEL[m]} ${formatINR(s[m])}`);
  return "= " + parts.join(" + ");
};

// Bill / receipt number to show; account payments have no bill.
const billNo = (r: CashBookRow) =>
  r.documentRef === "Sale" ||
  r.documentRef === "Purchase" ||
  r.documentRef === "Payment" ||
  r.documentRef === "Freight"
    ? r.documentNumber
    : "";

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
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Any filter change → back to page 1.
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, direction, mode, debounced]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCashBook({
      startDate,
      endDate,
      direction,
      mode,
      search: debounced,
      page,
      limit: PAGE_SIZE,
    })
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, direction, mode, debounced, page]);

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
  const pg = data?.pagination;

  return (
    <div className="space-y-4" data-testid="cash-book">
      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: "in", label: "Money in", sub: "Received from customers", tone: "text-emerald-600", Icon: ArrowDownLeft },
          { key: "out", label: "Money out", sub: "Vendors, transporters + refunds", tone: "text-rose-600", Icon: ArrowUpRight },
          { key: "net", label: "Net (in − out)", sub: "", tone: (t?.net.total ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600", Icon: null },
        ].map((c) => {
          const s = t?.[c.key as "in" | "out" | "net"];
          return (
            <Card key={c.key} data-testid={`cash-total-${c.key}`}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{c.label}</span>
                  {c.Icon && <c.Icon className={cn("h-5 w-5", c.tone)} />}
                </div>
                <div className={cn("text-2xl font-semibold mt-1", c.tone)}>
                  {s ? formatINR(s.total) : "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-1 leading-5">
                  {s ? splitText(s) : ""}
                </div>
                <div className="text-xs text-muted-foreground">
                  {s && c.key !== "net" ? `${s.count} payment(s) · ${c.sub}` : ""}
                  {s && c.key === "net" ? "Money in minus money out" : ""}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Show</span>
          <div className="inline-flex rounded-md border bg-white p-0.5" role="group">
            {(["all", "in", "out"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(d)}
                aria-pressed={direction === d}
                className={cn(
                  "h-9 px-3 text-sm rounded-[5px]",
                  direction === d
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {d === "all" ? "All" : d === "in" ? "Money in" : "Money out"}
              </button>
            ))}
          </div>
        </div>
        <div className="w-40">
          <span className="text-xs text-muted-foreground block mb-1">Mode</span>
          <Select value={mode} onValueChange={(v) => setMode(v as any)}>
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
        <div className="flex-1 min-w-[220px] max-w-sm">
          <span className="text-xs text-muted-foreground block mb-1">Party / bill no.</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white overflow-auto max-h-[70vh]">
        <table className="w-full text-sm">
          <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-muted">
            <tr className="border-b">
              <th className="p-3 text-left font-medium">Date</th>
              <th className="p-3 text-left font-medium">In / Out</th>
              <th className="p-3 text-left font-medium">Party</th>
              <th className="p-3 text-left font-medium">Mode</th>
              <th className="p-3 text-right font-medium">Amount</th>
              <th className="p-3 text-left font-medium">Reference / Bill no.</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            )}
            {data && data.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No money in or out for these filters.
                </td>
              </tr>
            )}
            {data?.rows.map((r) => (
              <tr key={r._id} className={cn("border-b last:border-b-0", loading && "opacity-60")}>
                <td className="p-3 whitespace-nowrap">{formatLongDate(new Date(r.date))}</td>
                <td className="p-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                      r.direction === "in"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-rose-50 text-rose-700 ring-rose-200"
                    )}
                  >
                    {r.direction === "in" ? (
                      <ArrowDownLeft className="h-3 w-3" />
                    ) : (
                      <ArrowUpRight className="h-3 w-3" />
                    )}
                    {r.direction === "in" ? "In" : "Out"}
                  </span>
                </td>
                <td className="p-3">
                  {r.party || "—"}
                  {r.partyCode && (
                    <span className="ml-1 text-xs text-muted-foreground">{r.partyCode}</span>
                  )}
                </td>
                <td className="p-3">{MODE_LABEL[r.mode]}</td>
                <td
                  className={cn(
                    "p-3 text-right font-medium whitespace-nowrap",
                    r.direction === "in" ? "text-emerald-700" : "text-rose-700"
                  )}
                >
                  {formatINR(r.amount)}
                </td>
                <td className="p-3">
                  <div>{billNo(r) || r.kind}</div>
                  <div className="text-xs text-muted-foreground">
                    {billNo(r) ? r.kind : ""}
                    {r.reference && r.reference !== billNo(r)
                      ? `${billNo(r) ? " · " : ""}Ref ${r.reference}`
                      : ""}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          {pg && pg.totalItems > 0
            ? `Showing ${(pg.currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                pg.currentPage * PAGE_SIZE,
                pg.totalItems
              )} of ${pg.totalItems.toLocaleString("en-IN")}`
            : ""}
        </span>
        <DataPagination
          currentPage={page}
          totalPages={pg?.totalPages || 1}
          onPageChange={setPage}
          disabled={loading}
        />
      </div>
    </div>
  );
}

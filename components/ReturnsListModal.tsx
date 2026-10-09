"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import DataPagination from "@/components/DataPagination";
import {
  getInventoryReturns,
  InventoryReturnRecord,
  InventoryReturnsPage,
} from "@/api/items";
import { formatINR, formatQty } from "@/utils/format";
import { formatLongDate } from "@/components/ui/DatePicker";

const PAGE_SIZE = 20;

// "Return Goods" entries (newest first) with the customer they were credited
// to, if any. Server-side search (return no. or customer) + pages. The dialog
// is a flex column capped at the screen height: header, search and pages stay
// put, only the table scrolls.
export default function ReturnsListModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [data, setData] = useState<InventoryReturnsPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // New search → back to page 1.
  useEffect(() => {
    setPage(1);
  }, [debounced]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    setLoading(true);
    getInventoryReturns({ search: debounced, page, limit: PAGE_SIZE })
      .then((d) => live && setData(d))
      .catch(() => live && setData(null))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [open, debounced, page]);

  const rows = data?.returns || [];
  const pg = data?.pagination;

  const qtyText = (it: InventoryReturnRecord["items"][number]) =>
    it.weight
      ? `${formatQty(it.weight, "kg")}${it.pieces ? `, ${formatQty(it.pieces, "pcs")}` : ""}`
      : formatQty(it.quantity ?? it.pieces, "pcs");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl flex flex-col max-h-[90vh] overflow-hidden"
        data-testid="returns-list"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Returns</DialogTitle>
          <DialogDescription>
            Goods returned to inventory. A return with a customer was credited
            to that customer&apos;s account.
          </DialogDescription>
        </DialogHeader>
        <div className="relative shrink-0 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Return no. (RET008) or customer"
            className="pl-9"
            data-testid="returns-search"
          />
        </div>
        <div
          className="rounded-md border overflow-auto overscroll-contain flex-1 min-h-0"
          data-testid="returns-scroll"
        >
          <table className="w-full text-sm">
            <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-muted">
              <tr className="border-b">
                <th className="p-2 text-left font-medium">Return No.</th>
                <th className="p-2 text-left font-medium">Date</th>
                <th className="p-2 text-left font-medium">Customer</th>
                <th className="p-2 text-left font-medium">Items</th>
                <th className="p-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              )}
              {data && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    {debounced ? `No returns match "${debounced}".` : "No returns yet."}
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  key={r._id}
                  className={`border-b last:border-b-0 align-top ${loading ? "opacity-60" : ""}`}
                >
                  <td className="p-2 font-medium whitespace-nowrap">
                    {r.returnNumber}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {formatLongDate(new Date(r.date))}
                  </td>
                  <td className="p-2">
                    {r.customer ? (
                      <>
                        {r.customer.businessName}
                        <span className="block text-xs text-green-700">
                          Credited
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        — (stock only)
                      </span>
                    )}
                  </td>
                  <td className="p-2 min-w-[180px]">
                    {r.items.map((it, i) => (
                      <div key={i} className="text-xs">
                        {it.name}: {qtyText(it)} × {formatINR(it.rate)}
                      </div>
                    ))}
                    {r.notes && (
                      <div className="text-xs text-muted-foreground italic">
                        {r.notes}
                      </div>
                    )}
                  </td>
                  <td className="p-2 text-right whitespace-nowrap">
                    {formatINR(r.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground" data-testid="returns-count">
            {pg && pg.totalItems > 0
              ? `Showing ${(pg.currentPage - 1) * pg.limit + 1}–${Math.min(
                  pg.currentPage * pg.limit,
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
      </DialogContent>
    </Dialog>
  );
}

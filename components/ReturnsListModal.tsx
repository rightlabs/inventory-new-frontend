"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInventoryReturns, InventoryReturnRecord } from "@/api/items";
import { formatINR, formatQty } from "@/utils/format";
import { formatLongDate } from "@/components/ui/DatePicker";

// Recent "Return to Inventory" entries (newest first) with the customer they
// were credited to, if any.
export default function ReturnsListModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [rows, setRows] = useState<InventoryReturnRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getInventoryReturns(100)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [open]);

  const qtyText = (it: InventoryReturnRecord["items"][number]) =>
    it.weight
      ? `${formatQty(it.weight, "kg")}${it.pieces ? `, ${formatQty(it.pieces, "pcs")}` : ""}`
      : formatQty(it.quantity ?? it.pieces, "pcs");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl" data-testid="returns-list">
        <DialogHeader>
          <DialogTitle>Returns</DialogTitle>
          <DialogDescription>
            Last 100 returns to inventory. A return with a customer was
            credited to that customer&apos;s account.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border overflow-auto max-h-[60vh]">
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
              {loading && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    No returns yet.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r._id} className="border-b last:border-b-0 align-top">
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
                    <td className="p-2">
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
      </DialogContent>
    </Dialog>
  );
}

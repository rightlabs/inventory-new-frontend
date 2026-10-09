"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPurchaseHistory } from "@/api/items";
import { History } from "lucide-react";
import { formatINR, formatQty } from "@/utils/format";
import { CodeBadge, DateCell, EmptyState } from "@/components/mis/ui";
import { Skeleton } from "@/components/ui/skeleton";

interface PurchaseHistoryItem {
  _id: string;
  date: string;
  rate: number;
  quantity: number;
  documentNumber: string;
  averageRate: number;
  // Bill rate + freight/logistics per unit = landed rate (the cost used).
  baseRate?: number;
  discountPerUnit?: number; // bill discount share per unit (Oct 2026 on)
  logisticsPerUnit?: number;
  landedRate?: number;
}

interface PriceHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
}

export default function PriceHistoryModal({
  open,
  onOpenChange,
  itemId,
  itemName,
}: PriceHistoryModalProps) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PurchaseHistoryItem[]>([]);
  const [itemInfo, setItemInfo] = useState<{
    name: string;
    currentRate: number;
    averageRate: number;
  } | null>(null);

  useEffect(() => {
    if (open && itemId) {
      fetchHistory();
    }
  }, [open, itemId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await getPurchaseHistory(itemId);
      if (response?.data?.data) {
        setHistory(response.data.data.history || []);
        setItemInfo(response.data.data.item);
      }
    } catch (error) {
      console.error("Failed to fetch price history:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[820px] max-h-[80vh] overflow-hidden flex flex-col min-w-0">
        <DialogHeader>
          <DialogTitle>Price History</DialogTitle>
          <DialogDescription className="font-medium text-slate-800 [overflow-wrap:anywhere]">{itemName}</DialogDescription>
        </DialogHeader>

        {/* Summary Section */}
        {itemInfo && (
          <div className="grid grid-cols-2 gap-4 p-4 border border-slate-200 bg-slate-50/80 rounded-lg mb-4 shrink-0">
            <div>
              <p className="text-sm text-muted-foreground">Current Rate</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatINR(itemInfo.currentRate || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Rate</p>
              <p className="text-lg font-semibold text-primary tabular-nums">
                {formatINR(itemInfo.averageRate || 0)}
              </p>
            </div>
          </div>
        )}

        {/* History Table */}
        {/* One scroller for both directions so the header row stays put. */}
        <div className="flex-1 min-h-0 min-w-0 overflow-auto overscroll-contain rounded-md border">
          {loading ? (
            <div className="space-y-3 p-4" aria-label="Loading price history">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              size="sm"
              icon={History}
              title="No purchase history found"
              description="Price history will appear here after purchases are made"
            />
          ) : (
            <div>
              <table className="w-full" data-testid="price-history-table">
                <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-muted">
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="h-10 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                      Purchase No
                    </th>
                    <th className="h-10 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                      Qty
                    </th>
                    <th className="h-10 px-4 text-right align-middle text-sm font-medium text-muted-foreground whitespace-nowrap">
                      Bill Rate
                    </th>
                    <th className="h-10 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                      Discount
                    </th>
                    <th className="h-10 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                      Logistics
                    </th>
                    <th className="h-10 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                      Cost
                    </th>
                    <th className="h-10 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                      Avg Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => (
                    <tr
                      key={item._id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-3 align-middle text-sm">
                        <DateCell date={item.date} />
                      </td>
                      <td className="p-3 align-middle text-sm">
                        {item.documentNumber ? <CodeBadge code={item.documentNumber} /> : "–"}
                      </td>
                      <td className="p-3 align-middle text-sm text-right tabular-nums">
                        {formatQty(item.quantity)}
                      </td>
                      <td className="p-3 align-middle text-sm text-right tabular-nums whitespace-nowrap">
                        {formatINR(item.baseRate ?? item.rate)}
                      </td>
                      <td className={`p-3 align-middle text-sm text-right tabular-nums whitespace-nowrap ${item.discountPerUnit ? "text-emerald-700" : "text-muted-foreground"}`}>
                        {item.discountPerUnit ? `−${formatINR(item.discountPerUnit)}` : "–"}
                      </td>
                      <td className={`p-3 align-middle text-sm text-right tabular-nums whitespace-nowrap ${item.logisticsPerUnit ? "text-amber-700" : "text-muted-foreground"}`}>
                        {item.logisticsPerUnit ? `+${formatINR(item.logisticsPerUnit)}` : "–"}
                      </td>
                      <td className="p-3 align-middle text-sm text-right tabular-nums whitespace-nowrap font-semibold text-slate-900">
                        {formatINR(item.landedRate ?? item.rate)}
                      </td>
                      <td className="p-3 align-middle text-sm text-right tabular-nums whitespace-nowrap font-medium">
                        {formatINR(item.averageRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

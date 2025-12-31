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
import { format } from "date-fns";

interface PurchaseHistoryItem {
  _id: string;
  date: string;
  rate: number;
  quantity: number;
  documentNumber: string;
  averageRate: number;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Price History</DialogTitle>
          <DialogDescription>{itemName}</DialogDescription>
        </DialogHeader>

        {/* Summary Section */}
        {itemInfo && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Rate</p>
              <p className="text-lg font-semibold">
                {formatCurrency(itemInfo.currentRate || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Rate</p>
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(itemInfo.averageRate || 0)}
              </p>
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              Loading...
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p>No purchase history found</p>
              <p className="text-sm">
                Price history will appear here after purchases are made
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
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
                    <th className="h-10 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                      Rate
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
                        {format(new Date(item.date), "dd/MM/yyyy")}
                      </td>
                      <td className="p-3 align-middle text-sm">
                        {item.documentNumber}
                      </td>
                      <td className="p-3 align-middle text-sm text-right">
                        {item.quantity}
                      </td>
                      <td className="p-3 align-middle text-sm text-right">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="p-3 align-middle text-sm text-right font-medium">
                        {formatCurrency(item.averageRate)}
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

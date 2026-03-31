"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";
import { cancelSale, returnSaleItems } from "@/api/sale";
import { Sale, SaleItem } from "@/types/type";

interface ReturnItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale;
  onSuccess: () => void;
}

export default function ReturnItemsModal({
  open,
  onOpenChange,
  sale,
  onSuccess,
}: ReturnItemsModalProps) {
  const [selectedItems, setSelectedItems] = useState<{
    [index: number]: boolean;
  }>({});
  const [returnQuantities, setReturnQuantities] = useState<{
    [index: number]: string;
  }>({});
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAvailableQuantity = (itemIndex: number, saleItem: SaleItem) => {
    const alreadyReturned = (sale.returnedItems || [])
      .filter((ri) => ri.itemIndex === itemIndex)
      .reduce((sum, ri) => sum + ri.quantityReturned, 0);
    const originalQty =
      saleItem.weight || saleItem.quantity || saleItem.pieces || 0;
    return originalQty - alreadyReturned;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleCheckItem = (index: number, checked: boolean) => {
    setSelectedItems((prev) => ({ ...prev, [index]: checked }));
    if (!checked) {
      setReturnQuantities((prev) => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    } else {
      const available = getAvailableQuantity(index, sale.items[index]);
      setReturnQuantities((prev) => ({
        ...prev,
        [index]: available.toString(),
      }));
    }
  };

  const calculateReturnTotal = () => {
    let total = 0;
    for (const [indexStr, qty] of Object.entries(returnQuantities)) {
      const index = Number(indexStr);
      if (!selectedItems[index]) continue;
      const saleItem = sale.items[index];
      const originalQty =
        saleItem.weight || saleItem.quantity || saleItem.pieces || 0;
      const unitPrice = originalQty > 0 ? saleItem.amount / originalQty : 0;
      total += unitPrice * (Number(qty) || 0);
    }
    return total;
  };

  const handleReturnItems = async () => {
    const itemsToReturn = Object.entries(selectedItems)
      .filter(([_, checked]) => checked)
      .map(([indexStr]) => {
        const index = Number(indexStr);
        const qty = Number(returnQuantities[index]) || 0;
        return { itemIndex: index, quantity: qty };
      })
      .filter((item) => item.quantity > 0);

    if (itemsToReturn.length === 0) {
      toast.error("Please select items to return");
      return;
    }

    // Validate quantities
    for (const item of itemsToReturn) {
      const available = getAvailableQuantity(
        item.itemIndex,
        sale.items[item.itemIndex]
      );
      if (item.quantity > available) {
        toast.error(
          `Return quantity for ${sale.items[item.itemIndex].name} exceeds available (${available})`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await returnSaleItems(sale._id, {
        items: itemsToReturn,
        reason,
      });
      if (response?.data?.statusCode === 200) {
        toast.success("Items returned successfully");
        onOpenChange(false);
        onSuccess();
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to return items";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSale = async () => {
    setIsSubmitting(true);
    try {
      const response = await cancelSale(sale._id, reason);
      if (response?.data?.statusCode === 200) {
        toast.success("Sale cancelled successfully");
        onOpenChange(false);
        onSuccess();
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to cancel sale";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasReturnableItems = sale.items.some(
    (item, index) => getAvailableQuantity(index, item) > 0
  );

  return (
    <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          Return / Cancel — {sale.saleNumber}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Sale Info */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg text-sm">
          <div>
            <span className="text-muted-foreground">Customer:</span>{" "}
            <span className="font-medium">{sale.customer.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total:</span>{" "}
            <span className="font-medium">
              {formatCurrency(sale.originalGrandTotal || sale.grandTotal)}
            </span>
          </div>
        </div>

        {/* Items List */}
        {hasReturnableItems ? (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left text-sm font-medium w-10"></th>
                  <th className="p-3 text-left text-sm font-medium">Item</th>
                  <th className="p-3 text-right text-sm font-medium">
                    Original
                  </th>
                  <th className="p-3 text-right text-sm font-medium">
                    Available
                  </th>
                  <th className="p-3 text-right text-sm font-medium w-24">
                    Return Qty
                  </th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, index) => {
                  const originalQty =
                    item.weight || item.quantity || item.pieces || 0;
                  const available = getAvailableQuantity(index, item);
                  if (available <= 0) return null;

                  return (
                    <tr key={index} className="border-b">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedItems[index] || false}
                          onCheckedChange={(checked) =>
                            handleCheckItem(index, checked as boolean)
                          }
                        />
                      </td>
                      <td className="p-3 text-sm">{item.name}</td>
                      <td className="p-3 text-sm text-right">{originalQty}</td>
                      <td className="p-3 text-sm text-right">{available}</td>
                      <td className="p-3">
                        {selectedItems[index] && (
                          <Input
                            type="number"
                            min={1}
                            max={available}
                            value={returnQuantities[index] || ""}
                            onChange={(e) =>
                              setReturnQuantities((prev) => ({
                                ...prev,
                                [index]: e.target.value,
                              }))
                            }
                            className="h-8 w-20 ml-auto text-right"
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            All items have already been returned.
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Reason (optional)
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for return/cancellation"
          />
        </div>

        {/* Return Summary */}
        {Object.values(selectedItems).some(Boolean) && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between font-medium">
              <span>Return Amount</span>
              <span className="text-red-600">
                {formatCurrency(calculateReturnTotal())}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isSubmitting || !hasReturnableItems}
            >
              Cancel Entire Sale
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Sale {sale.saleNumber}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will restore all inventory and reverse all financial
                transactions for this sale. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, go back</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelSale}>
                Yes, cancel sale
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleReturnItems}
            disabled={
              isSubmitting ||
              !Object.values(selectedItems).some(Boolean)
            }
          >
            Return Selected Items
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

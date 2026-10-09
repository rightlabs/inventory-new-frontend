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
import { formatINR, formatQty, round2 } from "@/utils/format";

interface ReturnItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale;
  onSuccess: () => void;
}

// A line sold by kg (pipes/sheets, kg-sold fittings/polish). Its `pieces` is a
// separate physical-piece counter. Pieces-unit lines: pieces = quantity.
const isWeightLine = (item: SaleItem) => Number(item.weight) > 0;
const soldPieces = (item: SaleItem) =>
  isWeightLine(item)
    ? Number(item.pieces || 0)
    : Number(item.pieces || item.quantity || 0);

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
  const [returnPieces, setReturnPieces] = useState<{
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
    return round2(originalQty - alreadyReturned);
  };

  // Pieces already returned on a line. Rows saved before the Oct 2026 fix
  // stored the kg number as pieces on weight lines, so those are estimated
  // pro-rata by kg (same rule as the backend).
  const getAvailablePieces = (itemIndex: number, saleItem: SaleItem) => {
    const sold = soldPieces(saleItem);
    const returned = (sale.returnedItems || [])
      .filter((ri) => ri.itemIndex === itemIndex)
      .reduce((sum, ri) => {
        if (ri.piecesTracked || !isWeightLine(saleItem)) {
          return sum + Number(ri.piecesReturned || 0);
        }
        const kg = Number(saleItem.weight) || 0;
        return sum + (sold > 0 && kg > 0 ? Math.round((sold * ri.quantityReturned) / kg) : 0);
      }, 0);
    return Math.max(0, sold - returned);
  };

  // Lines that need a separate Pieces box: kg lines that tracked pieces.
  const needsPiecesBox = (index: number, item: SaleItem) =>
    isWeightLine(item) && soldPieces(item) > 0 && getAvailablePieces(index, item) > 0;

  const handleCheckItem = (index: number, checked: boolean) => {
    setSelectedItems((prev) => ({ ...prev, [index]: checked }));
    if (!checked) {
      const drop = (prev: { [index: number]: string }) => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      };
      setReturnQuantities(drop);
      setReturnPieces(drop);
    } else {
      const item = sale.items[index];
      const available = getAvailableQuantity(index, item);
      setReturnQuantities((prev) => ({
        ...prev,
        [index]: available.toString(),
      }));
      // Full return by default → all remaining pieces come back too.
      if (needsPiecesBox(index, item)) {
        setReturnPieces((prev) => ({
          ...prev,
          [index]: String(getAvailablePieces(index, item)),
        }));
      }
    }
  };

  const handleQtyChange = (index: number, value: string) => {
    setReturnQuantities((prev) => ({ ...prev, [index]: value }));
    // Partial kg return: make the user enter the pieces explicitly.
    const item = sale.items[index];
    if (needsPiecesBox(index, item)) {
      const full = round2(value) >= getAvailableQuantity(index, item) - 1e-6;
      setReturnPieces((prev) => ({
        ...prev,
        [index]: full ? String(getAvailablePieces(index, item)) : "",
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
      // Rounded per line, like the backend, so the preview matches the credit.
      total = round2(total + round2(unitPrice * round2(qty)));
    }
    return total;
  };

  const handleReturnItems = async () => {
    const itemsToReturn = Object.entries(selectedItems)
      .filter(([_, checked]) => checked)
      .map(([indexStr]) => {
        const index = Number(indexStr);
        const qty = round2(returnQuantities[index]);
        const saleItem = sale.items[index];
        const pieces = needsPiecesBox(index, saleItem)
          ? returnPieces[index] === undefined || returnPieces[index] === ""
            ? undefined
            : Number(returnPieces[index])
          : undefined;
        return { itemIndex: index, quantity: qty, pieces };
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
      // Tolerance absorbs float noise from originalQty - alreadyReturned.
      if (item.quantity - available > 1e-6) {
        toast.error(
          `Return quantity for ${sale.items[item.itemIndex].name} exceeds available (${formatQty(available)})`
        );
        return;
      }
      const saleItem = sale.items[item.itemIndex];
      if (needsPiecesBox(item.itemIndex, saleItem)) {
        const maxPieces = getAvailablePieces(item.itemIndex, saleItem);
        // Required for every kg line that was sold with pieces (pipes, sheets
        // and kg-sold fittings / polish) so the pieces counter stays right.
        if (item.pieces === undefined) {
          toast.error(`Enter the number of pieces returned for ${saleItem.name}`);
          return;
        }
        const p = item.pieces ?? 0;
        if (!Number.isInteger(p) || p < 0) {
          toast.error(`Pieces for ${saleItem.name} must be a whole number`);
          return;
        }
        if (p < 1) {
          toast.error(`Enter the number of pieces returned for ${saleItem.name}`);
          return;
        }
        if (p > maxPieces) {
          toast.error(`Only ${maxPieces} pieces of ${saleItem.name} can be returned`);
          return;
        }
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
    (item, index) => getAvailableQuantity(index, item) > 1e-6
  );

  return (
    <DialogContent className="sm:max-w-[780px] max-h-[90vh] overflow-y-auto">
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
              {formatINR(sale.originalGrandTotal || sale.grandTotal)}
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
                  <th className="p-3 text-right text-sm font-medium w-24">
                    Pieces*
                  </th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, index) => {
                  const originalQty =
                    item.weight || item.quantity || item.pieces || 0;
                  const available = getAvailableQuantity(index, item);
                  if (available <= 1e-6) return null;
                  const unit = isWeightLine(item) ? "kg" : "pcs";
                  const piecesBox = needsPiecesBox(index, item);
                  const piecesAvail = getAvailablePieces(index, item);

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
                      <td className="p-3 text-sm text-right whitespace-nowrap">
                        {formatQty(originalQty, unit)}
                        {isWeightLine(item) && soldPieces(item) > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {soldPieces(item)} pcs
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-sm text-right whitespace-nowrap">
                        {formatQty(available, unit)}
                        {piecesBox && (
                          <div className="text-xs text-muted-foreground">
                            {piecesAvail} pcs
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {selectedItems[index] && (
                          <Input
                            type="number"
                            min={0}
                            max={available}
                            aria-label={`Return quantity for ${item.name}`}
                            value={returnQuantities[index] || ""}
                            onChange={(e) => handleQtyChange(index, e.target.value)}
                            className="h-8 w-20 ml-auto text-right"
                          />
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {selectedItems[index] &&
                          (piecesBox ? (
                            <div>
                              <Input
                                type="number"
                                min={0}
                                max={piecesAvail}
                                step={1}
                                inputMode="numeric"
                                aria-label={`Pieces returned for ${item.name}`}
                                placeholder="Req."
                                value={returnPieces[index] ?? ""}
                                onChange={(e) =>
                                  setReturnPieces((prev) => ({
                                    ...prev,
                                    [index]: e.target.value.replace(/[^\d]/g, ""),
                                  }))
                                }
                                className={`h-8 w-20 ml-auto text-right ${
                                  !returnPieces[index]
                                    ? "border-red-400"
                                    : ""
                                }`}
                              />
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                max {piecesAvail}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {isWeightLine(item) ? "—" : "same as qty"}
                            </span>
                          ))}
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
                {formatINR(calculateReturnTotal())}
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

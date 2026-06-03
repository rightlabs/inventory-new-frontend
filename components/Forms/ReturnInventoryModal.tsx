"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { InventoryItem } from "@/types/type";
import { addInventoryReturn } from "@/api/items";

interface ReturnLine {
  itemId: string;
  qty: string;
  pieces: string;
  rate: string;
}

interface ReturnInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  onSuccess?: () => void;
}

const sanitize = (v: string) => {
  let s = v.replace(/[^0-9.]/g, "");
  const parts = s.split(".");
  if (parts.length > 2) s = parts[0] + "." + parts.slice(1).join("");
  return s;
};

export default function ReturnInventoryModal({
  open,
  onOpenChange,
  items,
  onSuccess,
}: ReturnInventoryModalProps) {
  const [lines, setLines] = useState<ReturnLine[]>([
    { itemId: "", qty: "", pieces: "", rate: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addLine = () =>
    setLines((prev) => [...prev, { itemId: "", qty: "", pieces: "", rate: "" }]);
  const removeLine = (i: number) =>
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  const updateLine = (i: number, patch: Partial<ReturnLine>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const itemById = (id: string) => items.find((it) => it._id === id);

  const reset = () => {
    setLines([{ itemId: "", qty: "", pieces: "", rate: "" }]);
    setNotes("");
  };

  const handleSubmit = async () => {
    const payloadItems: {
      itemId: string;
      weight?: number;
      quantity?: number;
      pieces?: number;
      rate: number;
    }[] = [];

    for (const l of lines) {
      if (!l.itemId) continue;
      const item = itemById(l.itemId);
      if (!item) continue;
      const qty = parseFloat(l.qty);
      const rate = parseFloat(l.rate);
      const pieces = parseFloat(l.pieces);
      const isWeight = item.unitType === "weight";

      if (!qty || qty <= 0) {
        toast.error(`Enter quantity for ${item.name}`);
        return;
      }
      if (!rate || rate <= 0) {
        toast.error(`Enter return price for ${item.name}`);
        return;
      }
      // Pieces are mandatory when returning pipes/sheets so the physical piece
      // counter stays accurate (whole pieces only). Weight-sold fittings/polish
      // are optional and only restored when entered.
      if ((item as any).itemType === "PipeSheet" && !(pieces > 0)) {
        toast.error(`Enter the number of pieces for ${item.name}`);
        return;
      }

      payloadItems.push(
        isWeight
          ? {
              itemId: item._id,
              weight: qty,
              pieces: pieces > 0 ? pieces : undefined,
              rate,
            }
          : { itemId: item._id, quantity: qty, rate }
      );
    }

    if (payloadItems.length === 0) {
      toast.error("Add at least one item with quantity and price");
      return;
    }

    try {
      setSubmitting(true);
      const res = await addInventoryReturn({ items: payloadItems, notes });
      if (res?.data?.statusCode === 201) {
        toast.success("Return added to inventory");
        reset();
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to add return");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Return to Inventory</DialogTitle>
          <DialogDescription>
            Add items back into stock at a price you enter. This increases the
            stock and updates the item&apos;s weighted-average cost.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[55vh] overflow-auto pr-1">
          {lines.map((line, i) => {
            const item = itemById(line.itemId);
            const isWeight = item?.unitType === "weight";
            const unitLabel = item
              ? isWeight
                ? "Weight (kg)"
                : "Quantity (pcs)"
              : "Quantity";
            return (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 items-end border rounded-lg p-3"
              >
                <div className="col-span-12 md:col-span-4">
                  <label className="text-xs font-medium mb-1 block">Item</label>
                  <Select
                    value={line.itemId}
                    onValueChange={(value) => updateLine(i, { itemId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item…" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((it) => (
                        <SelectItem key={it._id} value={it._id}>
                          {it.name} ({it.currentStock}{" "}
                          {it.unitType === "weight" ? "kg" : "pcs"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div
                  className={`col-span-6 ${
                    isWeight ? "md:col-span-2" : "md:col-span-4"
                  }`}
                >
                  <label className="text-xs font-medium mb-1 block">
                    {unitLabel}
                  </label>
                  <Input
                    inputMode="decimal"
                    value={line.qty}
                    onChange={(e) =>
                      updateLine(i, { qty: sanitize(e.target.value) })
                    }
                    placeholder="0"
                  />
                </div>
                {isWeight && (
                  <div className="col-span-6 md:col-span-2">
                    <label className="text-xs font-medium mb-1 block">
                      {(item as any)?.itemType === "PipeSheet"
                        ? "Pieces*"
                        : "Pieces"}
                    </label>
                    <Input
                      inputMode="numeric"
                      value={line.pieces}
                      onChange={(e) =>
                        updateLine(i, { pieces: sanitize(e.target.value) })
                      }
                      placeholder="0"
                    />
                  </div>
                )}
                <div className="col-span-6 md:col-span-3">
                  <label className="text-xs font-medium mb-1 block">
                    Return Price (₹)
                  </label>
                  <Input
                    inputMode="decimal"
                    value={line.rate}
                    onChange={(e) =>
                      updateLine(i, { rate: sanitize(e.target.value) })
                    }
                    placeholder="0"
                  />
                </div>
                <div className="col-span-6 md:col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeLine(i)}
                    disabled={lines.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          <Button variant="outline" size="sm" onClick={addLine}>
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>

          <div>
            <label className="text-xs font-medium mb-1 block">
              Notes (optional)
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason / reference"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Add Return"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

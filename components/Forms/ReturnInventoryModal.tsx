"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/DatePicker";
import SearchSelect from "@/components/ui/SearchSelect";
import BalanceAmount from "@/components/BalanceAmount";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { InventoryItem } from "@/types/type";
import {
  addInventoryReturn,
  getItems,
  getReturnPrices,
  ReturnPriceHint,
} from "@/api/items";
import { getCustomers } from "@/api/customer";
import { balanceLabel, formatINR, formatQty, round2 } from "@/utils/format";
import { CodeBadge } from "@/components/mis/ui";

interface ReturnLine {
  itemId: string;
  qty: string;
  pieces: string;
  rate: string;
  /** true once the user typed a price — auto defaults never overwrite it. */
  rateEdited: boolean;
  hint?: ReturnPriceHint;
}

interface CustomerOption {
  _id: string;
  id: string; // C001
  name: string;
  currentBalance: number;
}

interface ReturnInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** Customers page "Return goods": open with this customer selected. */
  initialCustomerId?: string;
}

const sanitize = (v: string) => {
  let s = v.replace(/[^0-9.]/g, "");
  const parts = s.split(".");
  if (parts.length > 2) s = parts[0] + "." + parts.slice(1).join("");
  return s;
};

const emptyLine = (): ReturnLine => ({
  itemId: "",
  qty: "",
  pieces: "",
  rate: "",
  rateEdited: false,
});

// Pieces box mandatory: pipe/sheet, or a kg item that keeps a pieces count
// (server flag tracksPieces from GET /items).
const piecesRequired = (item?: InventoryItem) =>
  !!item &&
  item.unitType === "weight" &&
  ((item as any).itemType === "PipeSheet" || (item as any).tracksPieces === true);

const shortDate = (iso?: string) =>
  iso ? format(new Date(iso), "d MMM yyyy") : "";

export default function ReturnInventoryModal({
  open,
  onOpenChange,
  onSuccess,
  initialCustomerId,
}: ReturnInventoryModalProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [lines, setLines] = useState<ReturnLine[]>([emptyLine()]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const savingRef = useRef(false);

  // Opened for a given customer (Customers page): select them.
  useEffect(() => {
    if (open && initialCustomerId) setCustomerId(initialCustomerId);
  }, [open, initialCustomerId]);

  // Load ALL items (any type) and all active customers when opened.
  useEffect(() => {
    if (!open) return;
    getItems({})
      .then((res) => setItems(res?.data?.data || []))
      .catch(() => toast.error("Failed to load items"));
    getCustomers()
      .then((res) => setCustomers(res?.data?.data || []))
      .catch(() => toast.error("Failed to load customers"));
  }, [open]);

  const itemById = (id: string) => items.find((it) => it._id === id);
  const customer = customers.find((c) => c._id === customerId);

  const itemOptions = useMemo(
    () =>
      items.map((it) => ({
        value: it._id,
        label: it.name,
        hint: formatQty(it.currentStock, it.unitType === "weight" ? "kg" : "pcs"),
        keywords: (it as any).code || "",
      })),
    [items]
  );
  const customerOptions = useMemo(
    () =>
      customers.map((c) => ({
        value: c._id,
        label: c.name,
        hint: c.id,
        keywords: c.id,
      })),
    [customers]
  );

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (i: number) =>
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  const updateLine = (i: number, patch: Partial<ReturnLine>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  // Fill default prices (customer's last sale price, else selling rate) into
  // lines whose price the user has not typed.
  const applyDefaults = async (custId: string, target: ReturnLine[]) => {
    const ids = Array.from(
      new Set(target.filter((l) => l.itemId && !l.rateEdited).map((l) => l.itemId))
    );
    if (!custId || ids.length === 0) return;
    try {
      const hints = await getReturnPrices(custId, ids);
      setLines((prev) =>
        prev.map((l) => {
          const h = hints[l.itemId];
          if (!h || l.rateEdited) return l;
          return {
            ...l,
            hint: h,
            rate: h.unitPrice > 0 ? String(h.unitPrice) : "",
          };
        })
      );
    } catch {
      /* toast shown by the API layer */
    }
  };

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    if (!id) {
      // Back to a stock-only return: drop auto-filled selling prices.
      setLines((prev) =>
        prev.map((l) =>
          l.rateEdited ? l : { ...l, rate: "", hint: undefined }
        )
      );
      return;
    }
    applyDefaults(id, lines);
  };

  const handleItemChange = (i: number, itemId: string) => {
    const next = lines.map((l, idx) =>
      idx === i
        ? { ...l, itemId, rate: "", rateEdited: false, hint: undefined }
        : l
    );
    setLines(next);
    if (customerId) applyDefaults(customerId, [next[i]]);
  };

  const lineAmount = (l: ReturnLine) =>
    round2((parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0));
  const total = round2(lines.reduce((s, l) => s + lineAmount(l), 0));

  const reset = () => {
    setLines([emptyLine()]);
    setNotes("");
    setCustomerId("");
    setDate(new Date());
  };

  const handleSubmit = async () => {
    if (savingRef.current) return;
    const payloadItems: {
      itemId: string;
      weight?: number;
      quantity?: number;
      pieces?: number;
      rate: number;
    }[] = [];

    if (!date) {
      toast.error("Pick the return date");
      return;
    }

    for (const l of lines) {
      if (!l.itemId) continue;
      const item = itemById(l.itemId);
      if (!item) continue;
      const qty = round2(parseFloat(l.qty));
      const rate = round2(parseFloat(l.rate));
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
      // Pieces are mandatory when the item keeps a pieces count (pipes /
      // sheets, and kg fittings / polish that track pieces) so the counter
      // stays accurate (whole pieces only). Otherwise optional.
      if (piecesRequired(item) && !(pieces > 0)) {
        toast.error(`Enter the number of pieces for ${item.name}`);
        return;
      }
      if (l.pieces && !Number.isInteger(pieces)) {
        toast.error(`Pieces for ${item.name} must be a whole number`);
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
      savingRef.current = true;
      setSubmitting(true);
      const res = await addInventoryReturn({
        items: payloadItems,
        notes,
        date: format(date, "yyyy-MM-dd"),
        customerId: customerId || undefined,
      });
      if (res?.data?.statusCode === 201) {
        const doc = res.data.data;
        if (customer) {
          toast.success(
            `${doc.returnNumber}: ${formatINR(doc.totalAmount)} credited to ${customer.name}. ${balanceLabel(
              "customer",
              doc.customerBalance
            )}`,
            { duration: 6000 }
          );
        } else {
          toast.success(`${doc.returnNumber}: return added to inventory`);
        }
        reset();
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (e: any) {
      /* API layer already shows the server message */
    } finally {
      savingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl grid-cols-[minmax(0,1fr)]" data-testid="return-modal">
        <DialogHeader>
          <DialogTitle>Return Goods (without bill)</DialogTitle>
          <DialogDescription>
            {customer
              ? `Items go back into stock and the total is credited to ${customer.name}'s account. The price is the selling price (default: what they paid last time).`
              : "Add items back into stock at a price you enter. This increases the stock and updates the item's weighted-average cost. Choose a customer to give them credit."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">
                Customer
              </label>
              <SearchSelect
                testId="return-customer"
                options={customerOptions}
                value={customerId}
                onChange={handleCustomerChange}
                placeholder="No customer (stock only)"
                searchPlaceholder="Search customer name or code…"
                clearLabel="No customer (stock only)"
              />
              <p
                className="text-xs mt-1 text-muted-foreground"
                data-testid="return-customer-help"
              >
                Select the customer to credit their account. Leave empty for a
                stock-only return.
              </p>
              {customer && (
                <div
                  className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-600"
                  data-testid="return-customer-balance"
                >
                  <CodeBadge code={customer.id} />
                  <span>
                    Now:{" "}
                    <BalanceAmount
                      value={customer.currentBalance}
                      entity="customer"
                      className="font-semibold tabular-nums text-slate-900"
                    />
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">
                Return date
              </label>
              <DatePicker date={date} onDateChange={setDate} />
            </div>
          </div>

          {lines.map((line, i) => {
            const item = itemById(line.itemId);
            const isWeight = item?.unitType === "weight";
            const unitLabel = item
              ? isWeight
                ? "Weight (kg)"
                : "Quantity (pcs)"
              : "Quantity";
            const amount = lineAmount(line);
            return (
              <div
                key={i}
                data-testid={`return-line-${i}`}
                className="grid grid-cols-12 gap-2 items-end border rounded-lg p-3"
              >
                <div className="col-span-12 md:col-span-4">
                  <label className="text-xs font-medium mb-1 block">Item</label>
                  <SearchSelect
                    testId={`return-item-${i}`}
                    hintInTrigger={false}
                    options={itemOptions}
                    value={line.itemId}
                    onChange={(v) => handleItemChange(i, v)}
                    placeholder="Select item…"
                    searchPlaceholder="Search item name or code…"
                  />
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
                      {piecesRequired(item) ? "Pieces*" : "Pieces"}
                    </label>
                    <Input
                      inputMode="numeric"
                      value={line.pieces}
                      onChange={(e) =>
                        updateLine(i, {
                          pieces: e.target.value.replace(/[^0-9]/g, ""),
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                )}
                <div className="col-span-6 md:col-span-3">
                  <label className="text-xs font-medium mb-1 block whitespace-nowrap">
                    {/* Short label in both modes so it never wraps or spills
                        into the next column (was "Return Price (₹/kg)"). */}
                    Price (₹{item ? (isWeight ? "/kg" : "/pc") : ""})
                  </label>
                  <Input
                    inputMode="decimal"
                    value={line.rate}
                    onChange={(e) =>
                      updateLine(i, {
                        rate: sanitize(e.target.value),
                        rateEdited: true,
                      })
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
                    aria-label="Remove line"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="col-span-12 flex flex-wrap items-center justify-between gap-x-4 text-xs text-muted-foreground">
                  <span className="inline-flex flex-wrap items-center gap-x-1">
                    {customer && line.hint && !line.rateEdited ? (
                      line.hint.source === "last_sale" ? (
                        <>
                          Price from last sale{" "}
                          {line.hint.saleNumber && <CodeBadge code={line.hint.saleNumber} />}{" "}
                          ({shortDate(line.hint.saleDate)})
                        </>
                      ) : (
                        "Never bought by this customer — item selling rate"
                      )
                    ) : customer && line.rateEdited ? (
                      <span className="font-medium text-amber-700">Price changed by you</span>
                    ) : (
                      ""
                    )}
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">
                    Amount {formatINR(amount)}
                  </span>
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

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <div className="text-sm" data-testid="return-total">
            {customer ? "Credit to customer" : "Total"}:{" "}
            <span className="text-base font-semibold tabular-nums text-slate-900">{formatINR(total)}</span>
            {customer && total > 0 && (
              <span className="text-muted-foreground">
                {" "}
                · after return:{" "}
                <BalanceAmount
                  value={round2(customer.currentBalance - total)}
                  entity="customer"
                  className="font-medium tabular-nums"
                />
              </span>
            )}
          </div>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? "Saving…"
                : customer
                ? "Save Return & Credit"
                : "Add Return"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePicker, { formatLongDate } from "@/components/ui/DatePicker";
import toast from "react-hot-toast";
import { differenceInCalendarDays, format } from "date-fns";
import { AlertTriangle, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordCustomerPayment } from "@/api/customer";
import { recordVendorPayment } from "@/api/vendor";
import BalanceAmount from "@/components/BalanceAmount";
import { BalanceEntity, formatINR, round2 } from "@/utils/format";
import { cn } from "@/lib/utils";

type Mode = "cash" | "cheque" | "online";
const MODES: { value: Mode; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online" },
];

const OLD_DATE_DAYS = 30;

export interface PaymentTarget {
  _id: string;
  name: string;
  currentBalance: number;
}

interface RecordPaymentModalProps {
  entityType: BalanceEntity;
  target: PaymentTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Record a payment on a customer or vendor account (not against one bill).
 * Customer: money received. Vendor: money paid. Paying more than the balance
 * leaves an advance. Shared by the Customers and Vendors pages.
 */
export default function RecordPaymentModal({
  entityType,
  target,
  open,
  onOpenChange,
  onSuccess,
}: RecordPaymentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]" data-testid="record-payment-modal">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            {entityType === "customer" ? "Payment received from " : "Payment made to "}
            <span className="font-medium text-foreground">{target?.name}</span>
          </DialogDescription>
        </DialogHeader>
        {target && (
          <PaymentForm
            key={target._id}
            entityType={entityType}
            target={target}
            onCancel={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type PayRow = { amount: string; mode: Mode; reference: string };

// digits + one dot, max 2 decimals
const cleanAmount = (v: string) => {
  const clean = v.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
  const [i, d] = clean.split(".");
  return d !== undefined ? `${i}.${d.slice(0, 2)}` : i;
};

const MAX_ROWS = 6;

function PaymentForm({
  entityType,
  target,
  onCancel,
  onSuccess,
}: {
  entityType: BalanceEntity;
  target: PaymentTarget;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  // One row by default (amount + mode, as before). "+ Add mode" splits one
  // payment across modes, e.g. ₹6,000 Cash + ₹4,000 Online — each row is saved
  // as its own ledger line so the Cash Book counts it under its mode.
  const [rows, setRows] = useState<PayRow[]>([
    { amount: "", mode: "cash", reference: "" },
  ]);
  const [date, setDate] = useState<Date>(new Date());
  const [confirmOldDate, setConfirmOldDate] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false); // blocks a second click before re-render

  const split = rows.length > 1;
  const first = rows[0];
  const current = round2(target.currentBalance || 0);
  const amt = round2(rows.reduce((s, r) => s + round2(r.amount), 0));
  const after = round2(current - amt);
  const owed = Math.max(0, current);
  const daysAgo = differenceInCalendarDays(new Date(), date);
  const isOld = daysAgo > OLD_DATE_DAYS;

  const splitText =
    amt > 0 && amt > owed
      ? owed > 0
        ? `${formatINR(owed)} against balance, ${formatINR(round2(amt - owed))} advance`
        : `${formatINR(amt)} goes to advance`
      : "";

  const updateRow = (i: number, patch: Partial<PayRow>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const addRow = () =>
    setRows((rs) => {
      if (rs.length >= MAX_ROWS) return rs;
      // Suggest a mode not used yet (Cash → Online → Cheque).
      const used = new Set(rs.map((r) => r.mode));
      const next =
        (["cash", "online", "cheque"] as Mode[]).find((m) => !used.has(m)) ?? "cash";
      return [...rs, { amount: "", mode: next, reference: "" }];
    });

  const removeRow = (i: number) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : rs));

  const save = async () => {
    if (savingRef.current) return;
    if (rows.some((r) => !(round2(r.amount) > 0))) {
      toast.error(
        split
          ? "Enter an amount greater than 0 in every row (or remove the empty row)"
          : "Enter an amount greater than 0"
      );
      return;
    }
    if (daysAgo < 0) {
      toast.error("Payment date cannot be in the future");
      return;
    }
    if (isOld && !confirmOldDate) {
      setConfirmOldDate(true); // show the warning; next click saves
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      const parts = rows.map((r) => ({
        amount: round2(r.amount),
        mode: r.mode,
        reference: r.mode === "cash" ? undefined : r.reference.trim() || undefined,
      }));
      const payload = split
        ? { parts, date: format(date, "yyyy-MM-dd") }
        : { ...parts[0], date: format(date, "yyyy-MM-dd") };
      const res =
        entityType === "customer"
          ? await recordCustomerPayment(target._id, payload)
          : await recordVendorPayment(target._id, payload);
      if (res?.data?.statusCode === 201 || res?.data?.statusCode === 200) {
        const no = res.data.data?.transaction?.documentNumber;
        toast.success(`Payment recorded${no && entityType === "vendor" ? ` (${no})` : ""}`);
        onSuccess();
      }
    } catch {
      // The API layer already shows the server's error message.
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const addModeLink = rows.length < MAX_ROWS && (
    <button
      type="button"
      onClick={addRow}
      className="text-sm font-medium text-blue-600 hover:underline"
      data-testid="add-pay-mode"
    >
      + Add mode
    </button>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-4"
    >
      <div className="rounded-md bg-muted/40 px-3 py-2 text-sm flex justify-between gap-2">
        <span className="text-muted-foreground">Current balance</span>
        <BalanceAmount value={current} entity={entityType} className="font-medium" />
      </div>

      {!split ? (
        <>
          <div>
            <label htmlFor="pay-amount" className="text-sm font-medium mb-1 block">
              Amount*
            </label>
            <Input
              id="pay-amount"
              autoFocus
              inputMode="decimal"
              value={first.amount}
              onChange={(e) => updateRow(0, { amount: cleanAmount(e.target.value) })}
              placeholder="Enter amount"
              className="text-base"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Mode*</span>
              {addModeLink}
            </div>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment mode">
              {MODES.map((m) => (
                <Button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={first.mode === m.value}
                  variant={first.mode === m.value ? "default" : "outline"}
                  onClick={() => updateRow(0, { mode: m.value })}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-2" data-testid="pay-split">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Amount and mode*</span>
            {addModeLink}
          </div>
          {rows.map((r, i) => (
            <div key={i} className="space-y-2 rounded-md border p-2" data-testid="pay-row">
              <div className="flex gap-2">
                <Input
                  id={i === 0 ? "pay-amount" : undefined}
                  aria-label={`Amount ${i + 1}`}
                  autoFocus={i === rows.length - 1 && !r.amount}
                  inputMode="decimal"
                  value={r.amount}
                  onChange={(e) => updateRow(i, { amount: cleanAmount(e.target.value) })}
                  placeholder="Amount"
                  className="min-w-0 flex-1 text-base"
                />
                <Select
                  value={r.mode}
                  onValueChange={(v: Mode) => updateRow(i, { mode: v })}
                >
                  <SelectTrigger className="w-[110px] shrink-0" aria-label={`Mode ${i + 1}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove row ${i + 1}`}
                  onClick={() => removeRow(i)}
                  className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {r.mode !== "cash" && (
                <Input
                  aria-label={`Reference ${i + 1}`}
                  value={r.reference}
                  onChange={(e) => updateRow(i, { reference: e.target.value })}
                  placeholder={r.mode === "cheque" ? "Cheque number" : "UTR / transaction ID"}
                />
              )}
            </div>
          ))}
          <div
            className="flex justify-between gap-2 px-1 text-sm"
            data-testid="pay-total"
          >
            <span className="text-muted-foreground">Total payment</span>
            <span className="font-semibold">{formatINR(amt)}</span>
          </div>
        </div>
      )}

      <div>
        <span className="text-sm font-medium mb-1 block">Date*</span>
        <DatePicker
          date={date}
          onDateChange={(d) => {
            if (d) {
              setDate(d);
              setConfirmOldDate(false);
            }
          }}
        />
      </div>

      {!split && first.mode !== "cash" && (
        <div>
          <label htmlFor="pay-ref" className="text-sm font-medium mb-1 block">
            Reference
          </label>
          <Input
            id="pay-ref"
            value={first.reference}
            onChange={(e) => updateRow(0, { reference: e.target.value })}
            placeholder={first.mode === "cheque" ? "Cheque number" : "UTR / transaction ID"}
          />
        </div>
      )}

      {amt > 0 && (
        <div
          className="rounded-md border px-3 py-2 text-sm space-y-1"
          data-testid="balance-preview"
        >
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Balance after payment</span>
            <BalanceAmount value={after} entity={entityType} className="font-semibold" />
          </div>
          {splitText && <p className="text-xs text-green-700">{splitText}</p>}
        </div>
      )}

      {isOld && confirmOldDate && (
        <div
          className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          role="alert"
          data-testid="old-date-warning"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            This date is {daysAgo} days ago ({formatLongDate(date)}). Is this
            correct?
          </span>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className={cn(isOld && confirmOldDate && "bg-amber-600 hover:bg-amber-700")}
        >
          {saving
            ? "Saving..."
            : isOld && confirmOldDate
            ? "Yes, date is correct — Save"
            : "Save Payment"}
        </Button>
      </div>
    </form>
  );
}

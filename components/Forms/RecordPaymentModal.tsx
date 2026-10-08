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
import { AlertTriangle } from "lucide-react";
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
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<Mode>("cash");
  const [date, setDate] = useState<Date>(new Date());
  const [reference, setReference] = useState("");
  const [confirmOldDate, setConfirmOldDate] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false); // blocks a second click before re-render

  const current = round2(target.currentBalance || 0);
  const amt = round2(amount);
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

  const handleAmount = (v: string) => {
    // digits + one dot, max 2 decimals
    const clean = v.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
    const [i, d] = clean.split(".");
    setAmount(d !== undefined ? `${i}.${d.slice(0, 2)}` : i);
  };

  const save = async () => {
    if (savingRef.current) return;
    if (!(amt > 0)) {
      toast.error("Enter an amount greater than 0");
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
      const payload = {
        amount: amt,
        mode,
        reference: mode === "cash" ? undefined : reference.trim() || undefined,
        date: format(date, "yyyy-MM-dd"),
      };
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

      <div>
        <label htmlFor="pay-amount" className="text-sm font-medium mb-1 block">
          Amount*
        </label>
        <Input
          id="pay-amount"
          autoFocus
          inputMode="decimal"
          value={amount}
          onChange={(e) => handleAmount(e.target.value)}
          placeholder="Enter amount"
          className="text-base"
        />
      </div>

      <div>
        <span className="text-sm font-medium mb-1 block">Mode*</span>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment mode">
          {MODES.map((m) => (
            <Button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={mode === m.value}
              variant={mode === m.value ? "default" : "outline"}
              onClick={() => setMode(m.value)}
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

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

      {mode !== "cash" && (
        <div>
          <label htmlFor="pay-ref" className="text-sm font-medium mb-1 block">
            Reference
          </label>
          <Input
            id="pay-ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={mode === "cheque" ? "Cheque number" : "UTR / transaction ID"}
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

"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { addCustomerAdvance } from "@/api/customer";

interface AdvancePaymentModalProps {
  customerId: string;
  customerName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AdvancePaymentModal({
  customerId,
  customerName,
  onSuccess,
  onCancel,
}: AdvancePaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!mode) {
      toast.error("Please select a payment mode");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addCustomerAdvance(customerId, {
        amount: numAmount,
        mode,
        reference: reference || undefined,
        notes: notes || undefined,
      });

      if (res?.data?.statusCode === 201 || res?.data?.statusCode === 200) {
        toast.success("Advance payment recorded successfully");
        onSuccess();
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Failed to record advance payment";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 py-4">
        <p className="text-sm text-muted-foreground">
          Record an advance payment received from{" "}
          <span className="font-medium text-foreground">{customerName}</span>.
          This will be credited to their account.
        </p>

        <div>
          <label className="text-sm font-medium mb-1 block">Amount*</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter advance amount"
            min="1"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            Payment Mode*
          </label>
          <Select value={mode} onValueChange={setMode} required>
            <SelectTrigger>
              <SelectValue placeholder="Select payment mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Reference</label>
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Cheque number, transaction ID, etc."
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Notes</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Recording..." : "Record Advance"}
        </Button>
      </div>
    </form>
  );
}

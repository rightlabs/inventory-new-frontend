import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addPayment, addSalePayment } from "@/api/transaction";
import toast from "react-hot-toast";
import { formatINR } from "@/utils/format";
import { CodeBadge } from "@/components/mis/ui";
import { Fact, FactStrip, longDate } from "@/components/ModalParts";

// Interfaces
interface Sale {
  _id: string;
  saleNumber: string;
  grandTotal: number;
  balanceAmount: number;
  date?: string | Date;
  customer?: { name?: string };
}

interface Purchase {
  _id: string;
  purchaseNumber: string;
  grandTotal: number;
  balanceAmount: number;
  date?: string | Date;
  vendor?: { name?: string };
  freight?: number;
  freightPaidBy?: "shop" | "vendor";
  freightPayment?: { mode?: string; transporter?: string };
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: Sale;
  purchase?: Purchase;
  onSuccess: () => void;
}

interface PaymentFormData {
  amount: string;
  mode: "cash" | "cheque" | "online";
  reference: string;
  notes?: string;
  balance: number;
}

export default function PaymentModal({
  open,
  onOpenChange,
  sale,
  purchase,
  onSuccess,
}: PaymentModalProps) {
  const [formData, setFormData] = useState<PaymentFormData | any>({
    amount: "",
    mode: "cash",
    reference: "",
    notes: "",
  });

  const document = sale || purchase;
  const documentType = sale ? "sale" : "purchase";
  const documentNumber = sale ? sale.saleNumber : purchase?.purchaseNumber;

  const handleFullAmount = () => {
    if (document) {
      setFormData((prev: PaymentFormData) => ({
        ...prev,
        // 2 dp, floored (with a tiny epsilon for float noise) so it never
        // exceeds the outstanding balance.
        amount: String(Math.floor(document.balanceAmount * 100 + 1e-6) / 100),
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!document) {
        toast.error("Invalid document");
        return;
      }

      if (!formData.amount || Number(formData.amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      if (Number(formData.amount) > document.balanceAmount) {
        toast.error("Amount cannot be greater than balance amount");
        return;
      }

      if (formData.mode !== "cash" && !formData.reference) {
        toast.error("Reference number is required for cheque/online payments");
        return;
      }

      const paymentData = {
        amount: Number(formData.amount),
        mode: formData.mode,
        reference: formData.reference,
        notes: formData.notes || `Payment against ${documentNumber}`,
      };

      let response;
      if (sale) {
        response = await addSalePayment(sale._id, paymentData);
      } else if (purchase) {
        response = await addPayment(purchase._id, paymentData);
      }

      if (response?.data?.statusCode === 200) {
        toast.success("Payment added successfully");
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Failed to add payment");
      console.error("Payment error:", error);
    }
  };

  if (!document) return null;

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Add Payment</DialogTitle>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <FactStrip>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Fact label={documentType === "sale" ? "Sale Order" : "Purchase Order"}>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {documentNumber && <CodeBadge code={documentNumber} />}
                {document.date && (
                  <span className="text-xs font-normal text-slate-500">
                    {longDate(document.date)}
                  </span>
                )}
              </span>
            </Fact>
            {(sale?.customer?.name || purchase?.vendor?.name) && (
              <Fact label={sale ? "Customer" : "Vendor"}>
                {sale?.customer?.name || purchase?.vendor?.name}
              </Fact>
            )}
            <Fact label="Bill Total">{formatINR(document.grandTotal)}</Fact>
            <Fact label="Balance Amount" testId="payment-balance">
              <span className="text-base font-semibold text-red-700">
                {formatINR(document.balanceAmount)}
              </span>
            </Fact>
          </div>
          {Number(purchase?.freight) > 0 && (
            <p className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-600">
              {purchase?.freightPaidBy === "shop"
                ? `Freight ${formatINR(purchase?.freight || 0)} paid to ${purchase?.freightPayment?.transporter || "transporter"} — not on this bill`
                : `Includes freight ${formatINR(purchase?.freight || 0)} (vendor bill)`}
            </p>
          )}
        </FactStrip>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">Amount*</label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleFullAmount}
              className="h-7 text-xs px-2"
            >
              Add Full Amount
            </Button>
          </div>
          <Input
            type="number"
            max={document.balanceAmount}
            value={formData.amount}
            onChange={(e) =>
              setFormData((prev: PaymentFormData) => ({
                ...prev,
                amount: e.target.value,
              }))
            }
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            Payment Mode*
          </label>
          <Select
            value={formData.mode}
            onValueChange={(value: "cash" | "cheque" | "online") =>
              setFormData((prev: PaymentFormData) => ({ ...prev, mode: value }))
            }
          >
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

        {formData.mode !== "cash" && (
          <div>
            <label className="text-sm font-medium mb-1 block">
              Reference Number*
            </label>
            <Input
              value={formData.reference}
              onChange={(e) =>
                setFormData((prev: PaymentFormData) => ({
                  ...prev,
                  reference: e.target.value,
                }))
              }
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-1 block">Notes</label>
          <Input
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev: PaymentFormData) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Add Payment</Button>
      </div>
    </DialogContent>
  );
}

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

// Interfaces
interface Sale {
  _id: string;
  saleNumber: string;
  grandTotal: number;
  balanceAmount: number;
}

interface Purchase {
  _id: string;
  purchaseNumber: string;
  grandTotal: number;
  balanceAmount: number;
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
}

export default function PaymentModal({
  open,
  onOpenChange,
  sale,
  purchase,
  onSuccess,
}: PaymentModalProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
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
      setFormData((prev) => ({
        ...prev,
        amount:
          Math.floor(document.balanceAmount * 1000) /
          (1000).toFixed(3).replace(/[.,]00$/, ""),
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
        <div>
          <span className="block text-sm font-medium mb-2">
            {documentType === "sale" ? "Sale Order" : "Purchase Order"}
          </span>
          <span className="text-sm">{documentNumber}</span>
        </div>

        <div>
          <span className="block text-sm font-medium mb-2">Balance Amount</span>
          <span className="text-sm">
            ₹{document.balanceAmount.toLocaleString()}
          </span>
        </div>

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
              setFormData((prev) => ({ ...prev, amount: e.target.value }))
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
              setFormData((prev) => ({ ...prev, mode: value }))
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
                setFormData((prev) => ({ ...prev, reference: e.target.value }))
              }
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-1 block">Notes</label>
          <Input
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
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

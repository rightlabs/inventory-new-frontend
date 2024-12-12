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
import { addPayment } from "@/api/transaction";
import toast from "react-hot-toast";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: {
    _id: string;
    purchaseNumber: string;
    grandTotal: number;
    balanceAmount: number;
  };
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
  purchase,
  onSuccess,
}: PaymentModalProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: "",
    mode: "cash",
    reference: "",
    notes: "",
  });

  const handleFullAmount = () => {
    setFormData((prev) => ({
      ...prev,
      amount: purchase.balanceAmount.toString(),
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.amount || Number(formData.amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      if (Number(formData.amount) > purchase.balanceAmount) {
        toast.error("Amount cannot be greater than balance amount");
        return;
      }

      if (formData.mode !== "cash" && !formData.reference) {
        toast.error("Reference number is required for cheque/online payments");
        return;
      }

      const response = await addPayment(purchase._id, {
        amount: Number(formData.amount),
        mode: formData.mode,
        reference: formData.reference,
        notes: formData.notes || `Payment against ${purchase.purchaseNumber}`,
      });

      if (response?.data?.statusCode === 200) {
        toast.success("Payment added successfully");
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Failed to add payment");
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Add Payment</DialogTitle>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div>
          <span className="block text-sm font-medium mb-2">Purchase Order</span>
          <span className="text-sm">{purchase.purchaseNumber}</span>
        </div>

        <div>
          <span className="block text-sm font-medium mb-2">Balance Amount</span>
          <span className="text-sm">
            ₹{purchase.balanceAmount.toLocaleString()}
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
            max={purchase.balanceAmount}
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

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { createSale } from "@/api/sale";
import { getCustomerLedger } from "@/api/customer";
import toast from "react-hot-toast";
import CustomerForm from "./CustomerForm";
import { LedgerModal } from "./LedgerModal";
import DatePicker from "@/components/ui/DatePicker";
import ItemSelection from "../Sale/ItemSelection";
import { Customer, InventoryItem, SaleItem } from "@/types/type";

interface QuantityError {
  hasError: boolean;
  message: string;
}

interface SalesFormProps {
  customers: Customer[];
  items: InventoryItem[];
  isLoading: boolean;
  onSuccess?: () => void;
  fetchCustomers: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PaymentMode = "cash" | "cheque" | "online";

interface PaymentRow {
  amount: number | string;
  mode: PaymentMode;
  reference: string;
}

interface FormData {
  customerId: string;
  date: Date;
  deliveryAddress: string;
  vehicleNo: string;
  discount: number | string;
  discountType: "percent" | "amount";
  additionalCharges: number | string;
  additionalChargesLabel: string;
}

// Helper function to sanitize numeric input - only allows digits and decimal point
const sanitizeNumericInput = (value: string): string => {
  // Remove all characters except digits and decimal point
  let sanitized = value.replace(/[^0-9.]/g, '');
  // Ensure only one decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  return sanitized;
};

// Helper to prevent invalid key presses in number inputs
const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Allow: backspace, delete, tab, escape, enter, decimal point
  if (
    e.key === 'Backspace' ||
    e.key === 'Delete' ||
    e.key === 'Tab' ||
    e.key === 'Escape' ||
    e.key === 'Enter' ||
    e.key === '.' ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    e.key === 'Home' ||
    e.key === 'End'
  ) {
    return;
  }
  // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
  if (e.ctrlKey || e.metaKey) {
    return;
  }
  // Block non-numeric keys
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
};

export default function SalesForm({
  customers,
  items,
  isLoading,
  onSuccess,
  fetchCustomers,
  open,
  onOpenChange,
}: SalesFormProps) {
  const [customerOpen, setCustomerOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);
  const [showLedger, setShowLedger] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [quantityErrors, setQuantityErrors] = useState<{
    [key: number]: QuantityError;
  }>({});
  const [showPreview, setShowPreview] = useState(false);
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([]);
  const [formData, setFormData] = useState<FormData>({
    customerId: "",
    date: new Date(),
    deliveryAddress: "",
    vehicleNo: "",
    discount: "",
    discountType: "percent",
    additionalCharges: "",
    additionalChargesLabel: "",
  });

  const addPaymentRow = () => {
    setPaymentRows((prev) => [...prev, { amount: "", mode: "cash", reference: "" }]);
  };

  const updatePaymentRow = (idx: number, patch: Partial<PaymentRow>) => {
    setPaymentRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const removePaymentRow = (idx: number) => {
    setPaymentRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleViewLedger = async (customerId: string) => {
    try {
      const response = await getCustomerLedger(customerId);
      if (response?.data.success) {
        setTransactions(response.data.data);
        setShowLedger(true);
      }
    } catch (error) {
      toast.error("Failed to fetch ledger");
    }
  };

  const handleCustomerSelect = (value: string) => {
    setFormData((prev) => ({ ...prev, customerId: value }));
    const customer = customers.find((c) => c._id === value);
    setSelectedCustomer(customer || null);
  };

  const addItem = () => {
    setSelectedItems((prev) => [
      ...prev,
      {
        type: "",
        itemId: "",
        name: "",
        grade: "",
        size: "",
        gauge: "",
        subCategory: "",
        specification: "",
        quantity: undefined,
        weight: undefined,
        pieces: undefined,
        rate: 0,
        margin: 0,
        sellingPrice: 0,
        amount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setSelectedItems((items) => items.filter((_, i) => i !== index));
    // Also remove any quantity errors for this item
    const newErrors = { ...quantityErrors };
    delete newErrors[index];
    setQuantityErrors(newErrors);
  };

  const handleItemChange = (index: number, updatedItem: Partial<SaleItem>) => {
    const newItems = [...selectedItems];
    const currentItem = { ...newItems[index] };
    const newQuantityErrors = { ...quantityErrors };

    // Update the item with new values
    Object.assign(currentItem, updatedItem);

    // Validate stock if quantity/weight changed
    if ("quantity" in updatedItem || "weight" in updatedItem || "itemId" in updatedItem) {
      const selectedProduct = items.find((item) => item._id === currentItem.itemId);
      if (selectedProduct) {
        const isValid = checkStockAvailability(selectedProduct, currentItem);
        if (!isValid.valid) {
          newQuantityErrors[index] = {
            hasError: true,
            message: isValid.message,
          };
        } else {
          delete newQuantityErrors[index];
        }
      }
    }

    newItems[index] = currentItem as SaleItem;
    setSelectedItems(newItems);
    setQuantityErrors(newQuantityErrors);
  };

  const checkStockAvailability = (product: any, item: Partial<SaleItem>) => {
    if (product.unitType === "weight") {
      if ((item.weight || 0) > product.currentStock) {
        return {
          valid: false,
          message: `Only ${product.currentStock}kg available in stock`,
        };
      }
    } else {
      if ((item.quantity || 0) > product.currentStock) {
        return {
          valid: false,
          message: `Only ${product.currentStock} pieces available in stock`,
        };
      }
    }
    return { valid: true, message: "" };
  };

  const calculateTotals = () => {
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const discountValue = Number(formData.discount) || 0;
    const rawDiscountAmount =
      formData.discountType === "amount"
        ? discountValue
        : (subtotal * discountValue) / 100;
    // Cap discount at subtotal so grandTotal can't go negative.
    const discountAmount = Math.min(Math.max(0, rawDiscountAmount), subtotal);
    const additionalCharges = Number(formData.additionalCharges) || 0;
    const grandTotal = Number(
      (subtotal - discountAmount + additionalCharges).toFixed(2)
    );
    const amountPaidValue = paymentRows.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );
    const balance = Number((grandTotal - amountPaidValue).toFixed(2));

    return {
      subtotal,
      discountAmount,
      additionalCharges,
      grandTotal,
      amountPaid: amountPaidValue,
      balance,
    };
  };

  const getItemModel = (type: any) => {
    switch (type) {
      case "pipe":
      case "sheet":
        return "PipeSheet";
      case "fitting":
        return "Fitting";
      case "polish":
        return "Polish";
      default:
        throw new Error(`Invalid item type: ${type}`);
    }
  };

  const handleSubmit = () => {
    const missingFields = [];
    if (!formData.customerId) missingFields.push("customer");
    if (!formData.date) missingFields.push("date");
    if (selectedItems.length === 0) missingFields.push("items");

    const incompleteItems = selectedItems.filter(
      (item) => !item.itemId || (!item.quantity && !item.weight)
    );
    if (incompleteItems.length > 0) {
      missingFields.push("item details");
    }

    if (missingFields.length > 0) {
      toast.error(
        `Please fill in the following required field${
          missingFields.length > 1 ? "s" : ""
        }: ${missingFields.join(", ")}`
      );
      return;
    }

    const calculations = calculateTotals();

    // Validate split payments: total paid must not exceed grand total.
    if (calculations.amountPaid > calculations.grandTotal + 0.001) {
      toast.error(
        `Total payments (₹${calculations.amountPaid.toFixed(2)}) exceed grand total (₹${calculations.grandTotal.toFixed(2)})`
      );
      return;
    }

    // Validate each payment row has amount + mode
    const invalidRow = paymentRows.find(
      (p) => Number(p.amount) > 0 && !p.mode
    );
    if (invalidRow) {
      toast.error("Every payment row with an amount needs a payment mode");
      return;
    }

    if (selectedCustomer) {
      const potentialNewBalance = selectedCustomer.currentBalance + calculations.balance;
      if (selectedCustomer.creditLimit === 0) {
        toast("Note: Customer has no credit limit set", { icon: "ℹ️" });
      } else if (potentialNewBalance > selectedCustomer.creditLimit) {
        toast("Warning: This sale exceeds the customer's credit limit", { icon: "⚠️" });
      }
    }

    setShowPreview(true);
  };

  const handleConfirmSale = async () => {
    try {
      const calculations = calculateTotals();

      const validPayments = paymentRows
        .map((p) => ({
          amount: Number(p.amount) || 0,
          mode: p.mode,
          reference: p.reference || "",
          date: new Date(),
        }))
        .filter((p) => p.amount > 0);

      const saleData = {
        customerId: formData.customerId,
        date: formData.date,
        deliveryAddress: formData.deliveryAddress,
        vehicleNo: formData.vehicleNo,
        items: selectedItems.map((item) => ({
          itemId: item.itemId,
          itemModel: getItemModel(item.type),
          name: item.name,
          type: item.type,
          quantity: item.quantity,
          weight: item.weight,
          pieces: item.pieces || item.quantity,
          rate: Number(item.rate) || 0,
          margin: Number(item.margin) || 0,
          sellingPrice: Number(item.sellingPrice) || 0,
          amount: item.amount,
        })),
        discount: Number(formData.discount) || 0,
        discountType: formData.discountType,
        totalAmount: calculations.subtotal,
        discountAmount: calculations.discountAmount,
        additionalCharges: calculations.additionalCharges,
        additionalChargesLabel: formData.additionalChargesLabel || "",
        grandTotal: calculations.grandTotal,
        payments: validPayments,
      };

      const response = await createSale(saleData);

      if (response?.data.statusCode === 201) {
        toast.success("Sale created successfully");
        onOpenChange(false);
        onSuccess?.();
        resetForm();
      }
    } catch (error) {
      toast.error("Failed to create sale");
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: "",
      date: new Date(),
      deliveryAddress: "",
      vehicleNo: "",
      discount: "",
      discountType: "percent",
      additionalCharges: "",
      additionalChargesLabel: "",
    });
    setPaymentRows([]);
    setSelectedItems([]);
    setSelectedCustomer(null);
    setQuantityErrors({});
    setShowPreview(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
      {showPreview ? (
        <>
          <DialogHeader>
            <DialogTitle>Review Sale</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Customer & Date Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <span className="text-xs text-muted-foreground">Customer</span>
                <p className="font-medium">{selectedCustomer?.name}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Date</span>
                <p className="font-medium">
                  {formData.date.toLocaleDateString("en-IN")}
                </p>
              </div>
              {formData.deliveryAddress && (
                <div>
                  <span className="text-xs text-muted-foreground">Delivery Address</span>
                  <p className="font-medium">{formData.deliveryAddress}</p>
                </div>
              )}
              {formData.vehicleNo && (
                <div>
                  <span className="text-xs text-muted-foreground">Vehicle No.</span>
                  <p className="font-medium">{formData.vehicleNo}</p>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">#</th>
                    <th className="p-3 text-left text-sm font-medium">Item</th>
                    <th className="p-3 text-right text-sm font-medium">Qty</th>
                    <th className="p-3 text-right text-sm font-medium">Rate</th>
                    <th className="p-3 text-right text-sm font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-3 text-sm">{i + 1}</td>
                      <td className="p-3 text-sm">{item.name}</td>
                      <td className="p-3 text-sm text-right">
                        {item.weight || item.quantity || 0}
                      </td>
                      <td className="p-3 text-sm text-right">
                        {formatCurrency(item.sellingPrice)}
                      </td>
                      <td className="p-3 text-sm text-right">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Subtotal</span>
                <span>{formatCurrency(calculateTotals().subtotal)}</span>
              </div>
              {calculateTotals().discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span className="text-sm">
                    Discount
                    {formData.discountType === "percent" && Number(formData.discount) > 0
                      ? ` (${formData.discount}%)`
                      : ""}
                  </span>
                  <span>-{formatCurrency(calculateTotals().discountAmount)}</span>
                </div>
              )}
              {Number(formData.additionalCharges) > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span className="text-sm">{formData.additionalChargesLabel || "Additional Charges"}</span>
                  <span>+{formatCurrency(calculateTotals().additionalCharges)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Grand Total</span>
                <span className="text-lg">{formatCurrency(calculateTotals().grandTotal)}</span>
              </div>
              {paymentRows.filter((p) => Number(p.amount) > 0).length > 0 && (
                <div className="pt-2 border-t space-y-1">
                  {paymentRows
                    .filter((p) => Number(p.amount) > 0)
                    .map((p, i) => (
                      <div key={i} className="flex justify-between text-green-600 text-sm">
                        <span className="capitalize">
                          {p.mode}
                          {p.reference ? ` (${p.reference})` : ""}
                        </span>
                        <span>{formatCurrency(Number(p.amount))}</span>
                      </div>
                    ))}
                  <div className="flex justify-between text-green-700 font-medium">
                    <span>Total Paid</span>
                    <span>{formatCurrency(calculateTotals().amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Balance</span>
                    <span>{formatCurrency(calculateTotals().balance)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Action Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Back to Edit
            </Button>
            <Button onClick={handleConfirmSale} disabled={isLoading}>
              Confirm Sale
            </Button>
          </div>
        </>
      ) : (
        <>
          <DialogHeader>
            <DialogTitle>Create New Sale</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Customer Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium mb-1 block">Customer*</label>
                <div className="flex gap-2">
                  <Select value={formData.customerId} onValueChange={handleCustomerSelect}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer._id} value={customer._id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={customerOpen} onOpenChange={setCustomerOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                      </DialogHeader>
                      <CustomerForm
                        onSuccess={() => {
                          setCustomerOpen(false);
                          fetchCustomers();
                        }}
                        onCancel={() => setCustomerOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                {selectedCustomer && (
                  <div className="text-sm bg-muted/50 p-2 rounded">
                    <p>
                      Credit Limit: {formatCurrency(selectedCustomer?.creditLimit || 0)}
                    </p>
                    <p>
                      Current Balance: {formatCurrency(selectedCustomer?.currentBalance || 0)}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleViewLedger(selectedCustomer?._id)}
                      className="p-0 h-auto"
                    >
                      View Ledger
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Sale Date*</label>
                <DatePicker
                  date={formData.date}
                  onDateChange={(date) => {
                    if (date) {
                      setFormData((prev) => ({ ...prev, date }));
                    }
                  }}
                />
              </div>
            </div>

            {/* Basic Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Delivery Address</label>
                <Input
                  value={formData.deliveryAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      deliveryAddress: e.target.value,
                    }))
                  }
                  placeholder="Enter delivery address"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Vehicle No.</label>
                <Input
                  value={formData.vehicleNo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, vehicleNo: e.target.value }))}
                  placeholder="Enter vehicle number"
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4 relative">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Items</h3>
                {selectedItems.length > 0 && (
                  <span className="text-sm text-muted-foreground">{selectedItems.length} item(s)</span>
                )}
              </div>

              {/* Item Cards */}
              {selectedItems.map((item, index) => (
                <div key={index} className="border p-4 rounded-lg space-y-4 bg-white">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm text-muted-foreground">Item {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <ItemSelection
                    item={item}
                    index={index}
                    items={items}
                    onItemChange={handleItemChange}
                    quantityErrors={quantityErrors}
                  />
                </div>
              ))}

              {selectedItems.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p className="mb-4">No items added yet</p>
                  <Button onClick={addItem} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" /> Add Your First Item
                  </Button>
                </div>
              )}

              {/* Floating Add Item Button - shown when items exist */}
              {selectedItems.length > 0 && (
                <div className="flex justify-center pt-2">
                  <Button onClick={addItem} className="bg-primary hover:bg-primary/90 shadow-lg">
                    <Plus className="h-4 w-4 mr-2" /> Add Another Item
                  </Button>
                </div>
              )}
            </div>

            {/* Payment Section */}
            {selectedItems.length > 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Discount {formData.discountType === "percent" ? "(%)" : "(₹)"}
                    </label>
                    <div className="flex gap-2">
                      <div className="inline-flex rounded-md border overflow-hidden">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, discountType: "percent" }))
                          }
                          className={`px-3 text-sm font-medium ${
                            formData.discountType === "percent"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, discountType: "amount" }))
                          }
                          className={`px-3 text-sm font-medium ${
                            formData.discountType === "amount"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          ₹
                        </button>
                      </div>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={formData.discount}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            discount: sanitizeNumericInput(e.target.value),
                          }))
                        }
                        onKeyDown={handleNumericKeyDown}
                        placeholder="0"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Additional Charges</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={formData.additionalChargesLabel}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            additionalChargesLabel: e.target.value,
                          }))
                        }
                        placeholder="Label (e.g. Transport)"
                        className="flex-1"
                      />
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={formData.additionalCharges}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            additionalCharges: sanitizeNumericInput(e.target.value),
                          }))
                        }
                        onKeyDown={handleNumericKeyDown}
                        placeholder="0"
                        className="w-32"
                      />
                    </div>
                  </div>
                </div>

                {/* Payments section — supports split payments */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Payments</label>
                    <span className="text-xs text-muted-foreground">
                      {paymentRows.length === 0
                        ? "No payment yet — leave empty for unpaid"
                        : `${paymentRows.length} payment(s)`}
                    </span>
                  </div>

                  {paymentRows.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={row.amount}
                        onChange={(e) =>
                          updatePaymentRow(idx, {
                            amount: sanitizeNumericInput(e.target.value),
                          })
                        }
                        onKeyDown={handleNumericKeyDown}
                        placeholder="Amount"
                        className="flex-1"
                      />
                      <Select
                        value={row.mode}
                        onValueChange={(value: PaymentMode) =>
                          updatePaymentRow(idx, { mode: value })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                        </SelectContent>
                      </Select>
                      {row.mode !== "cash" && (
                        <Input
                          value={row.reference}
                          onChange={(e) =>
                            updatePaymentRow(idx, { reference: e.target.value })
                          }
                          placeholder="Reference"
                          className="flex-1"
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePaymentRow(idx)}
                        className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addPaymentRow}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {paymentRows.length === 0 ? "Add Payment" : "Add Another Payment"}
                  </Button>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Subtotal</span>
                    <span>{formatCurrency(calculateTotals().subtotal)}</span>
                  </div>
                  {calculateTotals().discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span className="text-sm">
                        Discount
                        {formData.discountType === "percent" && Number(formData.discount) > 0
                          ? ` (${formData.discount}%)`
                          : ""}
                      </span>
                      <span>-{formatCurrency(calculateTotals().discountAmount)}</span>
                    </div>
                  )}
                  {Number(formData.additionalCharges) > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span className="text-sm">{formData.additionalChargesLabel || "Additional Charges"}</span>
                      <span>+{formatCurrency(calculateTotals().additionalCharges)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Grand Total</span>
                    <span className="text-lg">{formatCurrency(calculateTotals().grandTotal)}</span>
                  </div>
                  {calculateTotals().amountPaid > 0 && (
                    <>
                      <div className="flex justify-between text-green-600">
                        <span>Total Paid</span>
                        <span>{formatCurrency(calculateTotals().amountPaid)}</span>
                      </div>
                      <div
                        className={`flex justify-between font-medium ${
                          calculateTotals().balance < 0 ? "text-orange-600" : "text-red-600"
                        }`}
                      >
                        <span>Balance</span>
                        <span>{formatCurrency(calculateTotals().balance)}</span>
                      </div>
                      {calculateTotals().balance < 0 && (
                        <p className="text-xs text-orange-600">
                          Payments exceed grand total by {formatCurrency(Math.abs(calculateTotals().balance))}.
                        </p>
                      )}
                    </>
                  )}
                </div>

                {selectedCustomer && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Available Credit:{" "}
                      {formatCurrency(
                        selectedCustomer.creditLimit - selectedCustomer.currentBalance
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || Object.keys(quantityErrors).length > 0}
            >
              Create Sale
            </Button>
          </div>

          {/* Ledger Modal */}
          {showLedger && (
            <LedgerModal
              transactions={transactions}
              open={showLedger}
              onClose={() => setShowLedger(false)}
            />
          )}
        </>
      )}
    </DialogContent>
  );
}

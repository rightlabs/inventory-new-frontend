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

interface FormData {
  customerId: string;
  date: Date;
  deliveryAddress: string;
  vehicleNo: string;
  discount: number | string;
  amountPaid: number | string;
  paymentMode: "cash" | "cheque" | "online";
  paymentReference: string;
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
  const [formData, setFormData] = useState<FormData>({
    customerId: "",
    date: new Date(),
    deliveryAddress: "",
    vehicleNo: "",
    discount: "",
    amountPaid: "",
    paymentMode: "cash",
    paymentReference: "",
  });

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
    const discountAmount = (subtotal * discountValue) / 100;
    const grandTotal = subtotal - discountAmount;
    const amountPaidValue = Number(formData.amountPaid) || 0;
    const balance = grandTotal - amountPaidValue;

    return {
      subtotal,
      discountAmount,
      grandTotal,
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

  const handleSubmit = async () => {
    try {
      const missingFields = [];
      if (!formData.customerId) missingFields.push("customer");
      if (!formData.date) missingFields.push("date");
      if (selectedItems.length === 0) missingFields.push("items");

      // Check if all items have required fields
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

      // Show warning if credit limit will be exceeded, but don't block the sale
      if (selectedCustomer) {
        const potentialNewBalance = selectedCustomer.currentBalance + calculations.balance;
        if (selectedCustomer.creditLimit === 0) {
          toast("Note: Customer has no credit limit set", { icon: "ℹ️" });
        } else if (potentialNewBalance > selectedCustomer.creditLimit) {
          toast("Warning: This sale exceeds the customer's credit limit", { icon: "⚠️" });
        }
      }

      const amountPaidValue = Number(formData.amountPaid) || 0;

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
          sellingPrice: item.sellingPrice,
          amount: item.amount,
        })),
        discount: Number(formData.discount) || 0,
        totalAmount: calculations.subtotal,
        discountAmount: calculations.discountAmount,
        grandTotal: calculations.grandTotal,
        payments:
          amountPaidValue > 0
            ? [
                {
                  amount: amountPaidValue,
                  mode: formData.paymentMode,
                  reference: formData.paymentReference,
                  date: new Date(),
                },
              ]
            : [],
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
      amountPaid: "",
      paymentMode: "cash",
      paymentReference: "",
    });
    setSelectedItems([]);
    setSelectedCustomer(null);
    setQuantityErrors({});
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
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Items</h3>
            <Button onClick={addItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
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
              <p className="mb-2">No items added yet</p>
              <Button onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Your First Item
              </Button>
            </div>
          )}
        </div>

        {/* Payment Section */}
        {selectedItems.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Discount (%)</label>
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
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Amount Paid</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={formData.amountPaid}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      amountPaid: sanitizeNumericInput(e.target.value),
                    }))
                  }
                  onKeyDown={handleNumericKeyDown}
                  placeholder="0"
                />
              </div>

              {Number(formData.amountPaid) > 0 && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Payment Mode</label>
                    <Select
                      value={formData.paymentMode}
                      onValueChange={(value: "cash" | "cheque" | "online") =>
                        setFormData((prev) => ({ ...prev, paymentMode: value }))
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

                  {formData.paymentMode !== "cash" && (
                    <div>
                      <label className="text-sm font-medium mb-1 block">Reference Number</label>
                      <Input
                        value={formData.paymentReference}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            paymentReference: e.target.value,
                          }))
                        }
                        placeholder="Enter reference number"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Subtotal</span>
                <span>{formatCurrency(calculateTotals().subtotal)}</span>
              </div>
              {Number(formData.discount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span className="text-sm">Discount ({formData.discount}%)</span>
                  <span>-{formatCurrency(calculateTotals().discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Grand Total</span>
                <span className="text-lg">{formatCurrency(calculateTotals().grandTotal)}</span>
              </div>
              {Number(formData.amountPaid) > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Amount Paid</span>
                    <span>{formatCurrency(Number(formData.amountPaid))}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Balance</span>
                    <span>{formatCurrency(calculateTotals().balance)}</span>
                  </div>
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
    </DialogContent>
  );
}

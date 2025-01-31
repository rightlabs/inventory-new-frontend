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

interface Customer {
  _id: string;
  name: string;
  creditLimit: number;
  currentBalance: number;
}

interface SaleItem {
  type: string;
  itemId: string;
  name: string;
  grade?: string;
  size?: string;
  gauge?: string;
  subCategory?: string;
  specification?: string;
  quantity?: number;
  weight?: number;
  rate: number;
  margin: number;
  sellingPrice: number;
  amount: number;
  gst: number;
  gstAmount: number;
}

interface FormData {
  customerId: string;
  date: Date;
  deliveryAddress: string;
  vehicleNo: string;
  discount: number;
  amountPaid: number;
  paymentMode: "cash" | "cheque" | "online";
  paymentReference: string;
}

interface SalesFormProps {
  customers: Customer[];
  items: any[];
  isLoading: boolean;
  onSuccess?: () => void;
  fetchCustomers: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  const [formData, setFormData] = useState<FormData>({
    customerId: "",
    date: new Date(),
    deliveryAddress: "",
    vehicleNo: "",
    discount: 0,
    amountPaid: 0,
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
        rate: 0,
        margin: 0,
        sellingPrice: 0,
        amount: 0,
        gst: 0,
        gstAmount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setSelectedItems((items) => items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, updatedItem: Partial<SaleItem>) => {
    const newItems = [...selectedItems];
    const currentItem = { ...newItems[index] };

    // Update the item with new values
    Object.assign(currentItem, updatedItem);

    // If itemId changed, update related values
    if (updatedItem.itemId && updatedItem.itemId !== currentItem.itemId) {
      const selectedProduct = items.find(
        (item) => item._id === updatedItem.itemId
      );
      if (selectedProduct) {
        // Set base values from selected product
        currentItem.name = selectedProduct.name;
        currentItem.gst = selectedProduct.gst;
        currentItem.rate = selectedProduct.purchaseRate || 0;
        currentItem.margin = 0; // Reset margin when product changes
        currentItem.sellingPrice = selectedProduct.purchaseRate || 0;

        // Reset quantity/weight based on unit type
        if (selectedProduct.unitType === "weight") {
          currentItem.weight = 0;
          currentItem.quantity = undefined;
        } else {
          currentItem.quantity = 1;
          currentItem.weight = undefined;
        }

        // Set initial amount and GST
        const quantity =
          selectedProduct.unitType === "weight"
            ? currentItem.weight
            : currentItem.quantity;
        currentItem.amount = quantity * currentItem.rate;
        currentItem.gstAmount = (currentItem.amount * currentItem.gst) / 100;
      }
    }

    // If rate, margin, quantity, or weight changed, recalculate values
    if (
      "rate" in updatedItem ||
      "margin" in updatedItem ||
      "quantity" in updatedItem ||
      "weight" in updatedItem
    ) {
      const selectedProduct = items.find(
        (item) => item._id === currentItem.itemId
      );
      if (selectedProduct) {
        // Calculate selling price
        currentItem.sellingPrice =
          currentItem.rate * (1 + currentItem.margin / 100);

        // Calculate amount based on unit type
        if (selectedProduct.unitType === "weight") {
          currentItem.amount =
            (currentItem.weight || 0) * currentItem.sellingPrice;
        } else {
          currentItem.amount =
            (currentItem.quantity || 0) * currentItem.sellingPrice;
        }

        // Calculate GST amount
        currentItem.gstAmount = (currentItem.amount * currentItem.gst) / 100;
      }
    }

    newItems[index] = currentItem as SaleItem;
    setSelectedItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = selectedItems.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    const totalTax = selectedItems.reduce(
      (sum, item) => sum + (item.gstAmount || 0),
      0
    );
    const discountAmount = (subtotal * Number(formData.discount)) / 100;
    const grandTotal = subtotal + totalTax - discountAmount;
    const balance = grandTotal - Number(formData.amountPaid);

    return {
      subtotal,
      totalTax,
      discountAmount,
      grandTotal,
      balance,
    };
  };

  const handleSubmit = async () => {
    try {
      if (
        !formData.customerId ||
        !formData.date ||
        selectedItems.length === 0
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      const calculations = calculateTotals();

      if (selectedCustomer) {
        const potentialNewBalance =
          selectedCustomer.currentBalance + calculations.balance;
        if (potentialNewBalance > selectedCustomer.creditLimit) {
          toast.error("This sale would exceed the customer's credit limit");
          return;
        }
      }

      const saleData = {
        customerId: formData.customerId,
        date: formData.date,
        deliveryAddress: formData.deliveryAddress,
        vehicleNo: formData.vehicleNo,
        items: selectedItems.map((item) => ({
          item: item.itemId,
          name: item.name,
          type: item.type,
          quantity: item.quantity,
          weight: item.weight,
          rate: item.rate,
          margin: item.margin,
          sellingPrice: item.sellingPrice,
          amount: item.amount,
          gst: item.gst,
          gstAmount: item.gstAmount,
        })),
        discount: Number(formData.discount),
        taxableAmount: calculations.subtotal,
        totalTax: calculations.totalTax,
        discountAmount: calculations.discountAmount,
        grandTotal: calculations.grandTotal,
        payments:
          formData.amountPaid > 0
            ? [
                {
                  amount: Number(formData.amountPaid),
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
      discount: 0,
      amountPaid: 0,
      paymentMode: "cash",
      paymentReference: "",
    });
    setSelectedItems([]);
    setSelectedCustomer(null);
  };

  return (
    <DialogContent className="sm:max-w-[900px]">
      <DialogHeader>
        <DialogTitle>Create New Sale</DialogTitle>
      </DialogHeader>

      <div className="grid gap-6 py-4">
        {/* Customer Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium mb-1 block">Customer*</label>
            <div className="flex gap-2">
              <Select
                value={formData.customerId}
                onValueChange={handleCustomerSelect}
              >
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
              <div className="text-sm">
                <p>
                  Credit Limit: ₹{selectedCustomer.creditLimit.toLocaleString()}
                </p>
                <p>
                  Current Balance: ₹
                  {selectedCustomer.currentBalance.toLocaleString()}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewLedger(selectedCustomer._id)}
                  className="mt-2"
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
            <label className="text-sm font-medium mb-1 block">
              Delivery Address
            </label>
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
            <label className="text-sm font-medium mb-1 block">
              Vehicle No.
            </label>
            <Input
              value={formData.vehicleNo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, vehicleNo: e.target.value }))
              }
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

          {selectedItems.map((item, index) => (
            <div key={index} className="border p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Item {index + 1}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              <ItemSelection
                item={item}
                index={index}
                items={items}
                onItemChange={handleItemChange}
              />

              {item.itemId && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Selling Price
                    </label>
                    <Input
                      type="number"
                      value={item.sellingPrice || 0}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Amount
                    </label>
                    <Input type="number" value={item.amount || 0} disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      GST (%)
                    </label>
                    <Input type="number" value={item.gst || 0} disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      GST Amount
                    </label>
                    <Input type="number" value={item.gstAmount || 0} disabled />
                  </div>
                </div>
              )}
            </div>
          ))}

          {selectedItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              No items added. Click "Add Item" to start adding products.
            </div>
          )}
        </div>

        {/* Payment Section */}
        {selectedItems.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Discount (%)
                </label>
                <Input
                  type="number"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      discount: Number(e.target.value),
                    }))
                  }
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Amount Paid
                </label>
                <Input
                  type="number"
                  value={formData.amountPaid}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      amountPaid: Number(e.target.value),
                    }))
                  }
                  min="0"
                  max={calculateTotals().grandTotal}
                />
              </div>

              {formData.amountPaid > 0 && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Payment Mode
                    </label>
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
                      <label className="text-sm font-medium mb-1 block">
                        Reference Number
                      </label>
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
                <span>₹{calculateTotals().subtotal.toLocaleString()}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span className="text-sm">
                    Discount ({formData.discount}%)
                  </span>
                  <span>
                    -₹{calculateTotals().discountAmount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm">GST</span>
                <span>₹{calculateTotals().totalTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Grand Total</span>
                <span>₹{calculateTotals().grandTotal.toLocaleString()}</span>
              </div>
              {formData.amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Amount Paid</span>
                    <span>₹{Number(formData.amountPaid).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Balance</span>
                    <span>₹{calculateTotals().balance.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {selectedCustomer && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Available Credit: ₹
                  {(
                    selectedCustomer.creditLimit -
                    selectedCustomer.currentBalance
                  ).toLocaleString()}
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
        <Button onClick={handleSubmit} disabled={isLoading}>
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

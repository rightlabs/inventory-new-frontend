import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSpreadsheet, Plus, Trash2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import CustomerForm from "./CustomerForm";
import { createSale } from "@/api/sale";
import { getCustomerLedger } from "@/api/customer";
import { Customer } from "@/api/customer";
import { LedgerModal, TransactionData } from "./LedgerModal";
import DatePicker from "../ui/DatePicker";
import { InventoryItem } from "@/api/items";

// Add these interfaces/types
type ItemType = "PipeSheet" | "Fitting" | "Polish";

interface SaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  isLoading: boolean;
  onSuccess?: () => void;
  fetchCustomers: () => void;
  items: InventoryItem[];
}

interface SaleItem {
  id: number;
  itemType: ItemType;
  productId: string;
  quantity: number;
  weight?: number;
  rate: number;
  amount: number;
  gst: number;
  gstAmount: number;
}

export default function SaleForm({
  open,
  onOpenChange,
  customers,
  isLoading,
  onSuccess,
  fetchCustomers,
  items,
}: SaleFormProps) {
  const [customerOpen, setCustomerOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);
  const [showLedger, setShowLedger] = useState(false);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  // Add this inside your SaleForm component, before return statement
  const [selectedItemType, setSelectedItemType] = useState<ItemType | "">("");

  const getItemUnitType = (itemId: string) => {
    if (!itemId) return "pieces";
    const item = items.find((i) => i._id === itemId);
    return item?.unitType || "pieces";
  };

  const [formData, setFormData] = useState({
    customerId: "",
    date: new Date(),
    deliveryAddress: "",
    vehicleNo: "",
    paymentTerms: "",
    discount: 0,
    amountPaid: 0,
    paymentMode: "cash" as "cash" | "cheque" | "online",
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
    setSelectedItems([
      ...selectedItems,
      {
        id: Date.now(),
        itemType: "" as ItemType, // Initialize as empty string
        productId: "",
        quantity: 0,
        weight: 0,
        rate: 0,
        amount: 0,
        gst: 0,
        gstAmount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // Update your updateItem function to handle the amount calculation based on unit type:
  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...selectedItems];
    const item = { ...newItems[index] };

    if (field === "itemType") {
      // When changing item type, reset product-related fields
      item.itemType = value as ItemType;
      item.productId = "";
      item.quantity = 0;
      item.weight = 0;
      item.rate = 0;
      item.amount = 0;
      item.gst = 0;
      item.gstAmount = 0;
    } else if (field === "productId") {
      // When selecting a product, update related fields
      item.productId = value;
      const product = items.find((i) => i._id === value);
      if (product) {
        item.rate = product.sellingRate;
        item.gst = product.gst;
      }
    } else {
      item[field] = value;
    }

    // Recalculate amount and GST based on unit type
    if (
      field === "quantity" ||
      field === "weight" ||
      field === "rate" ||
      field === "productId"
    ) {
      const unitType = getItemUnitType(item.productId);
      const quantity =
        unitType === "weight" ? item.weight || 0 : item.quantity || 0;
      item.amount = quantity * item.rate;
      item.gstAmount = (item.amount * item.gst) / 100;
    }

    newItems[index] = item;
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

      // In SaleForm.tsx, when transforming items:
      const transformedItems = selectedItems.map((item) => {
        const selectedProduct = items.find((i) => i._id === item.productId);
        if (!selectedProduct) {
          throw new Error("Product not found");
        }
        let type;
        if (item.itemType === "PipeSheet") {
          if (selectedProduct.name.includes("PIP")) {
            type = "pipe";
          } else if (selectedProduct.name.includes("Sheet")) {
            type = "sheet";
          }
        } else if (item.itemType === "Fitting") {
          type = "fitting";
        } else if (item.itemType === "Polish") {
          type = "polish";
        }

        const baseItem = {
          name: selectedProduct.name,
          type: type,
          rate: item.rate,
          amount: item.amount,
          gst: item.gst,
          gstAmount: item.gstAmount,
          item: item.productId,
        };

        // Add quantity based on unit type
        if (selectedProduct.unitType === "weight") {
          baseItem.weight = item.weight;
        } else {
          baseItem.quantity = item.quantity;
        }

        // Add pieces if needed
        if (
          selectedProduct.itemType === "PipeSheet" ||
          (selectedProduct.itemType === "Fitting" &&
            selectedProduct.subCategory === "bush")
        ) {
          baseItem.pieces = item.quantity;
        }

        return baseItem;
      });

      const saleData = {
        customerId: formData.customerId,
        date: formData.date,
        items: transformedItems, // Use transformed items
        paymentTerms: formData.paymentTerms,
        deliveryAddress: formData.deliveryAddress,
        vehicleNo: formData.vehicleNo,
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
      toast.error(
        error instanceof Error ? error.message : "Failed to create sale"
      );
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: "",
      date: new Date(),
      deliveryAddress: "",
      vehicleNo: "",
      paymentTerms: "",
      discount: 0,
      amountPaid: 0,
      paymentMode: "cash",
      paymentReference: "",
    });
    setSelectedItems([]);
    setSelectedCustomer(null);
  };

  return (
    <DialogContent className="sm:max-w-7xl max-h-[95vh]  overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create New Sale</DialogTitle>
        <DialogDescription>Add items and enter sale details</DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 py-4">
        {/* Customer and Basic Details */}
        <div className="grid gap-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">
                Customer*
              </label>
              <Select
                value={formData.customerId}
                onValueChange={handleCustomerSelect}
              >
                <SelectTrigger>
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
              {selectedCustomer && (
                <div className="text-xs text-muted-foreground mt-1">
                  <p>
                    Credit Limit: ₹
                    {selectedCustomer.creditLimit.toLocaleString()}
                  </p>
                  <p>
                    Current Balance: ₹
                    {selectedCustomer.currentBalance.toLocaleString()}
                  </p>
                  {formData.customerId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleViewLedger(formData.customerId)}
                    >
                      View Ledger
                    </Button>
                  )}
                </div>
              )}
            </div>
            <Dialog open={customerOpen} onOpenChange={setCustomerOpen}>
              <DialogTrigger asChild>
                <Button className="mt-6" variant="outline" size="icon">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Sale Date*
              </label>
              <DatePicker
                date={formData.date}
                onDateChange={(date) => {
                  if (date) {
                    setFormData((prev) => ({
                      ...prev,
                      date,
                    }));
                  }
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Vehicle No.
              </label>
              <Input
                name="vehicleNo"
                placeholder="Enter vehicle number"
                value={formData.vehicleNo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    vehicleNo: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Delivery Address
            </label>
            <Input
              name="deliveryAddress"
              placeholder="Enter delivery address"
              value={formData.deliveryAddress}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  deliveryAddress: e.target.value,
                }))
              }
            />
          </div>
        </div>

        {/* Items Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Items</h3>
              <Button onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-24">Quantity</TableHead>
                    <TableHead className="w-28">Weight</TableHead>
                    <TableHead className="w-32">Rate</TableHead>
                    <TableHead className="w-36">Amount</TableHead>
                    <TableHead className="w-20">GST</TableHead>
                    <TableHead className="w-36">GST Amount</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedItems.map((item, index) => {
                    const unitType = item.productId
                      ? getItemUnitType(item.productId)
                      : "pieces";

                    return (
                      <TableRow key={item.id}>
                        {/* ------------------ Item Type ------------------  */}
                        <TableCell>
                          <Select
                            value={item.itemType}
                            onValueChange={(value: ItemType) => {
                              updateItem(index, "itemType", value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PipeSheet">
                                Pipe/Sheet
                              </SelectItem>
                              <SelectItem value="Fitting">Fitting</SelectItem>
                              <SelectItem value="Polish">Polish</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        {/* ------------------ Product Selection ------------------ */}
                        <TableCell>
                          <Select
                            value={item.productId}
                            onValueChange={(value) =>
                              updateItem(index, "productId", value)
                            }
                            disabled={!item.itemType}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {items
                                .filter(
                                  (product) =>
                                    product.itemType === item.itemType
                                )
                                .map((product) => (
                                  <SelectItem
                                    key={product._id}
                                    value={product._id}
                                  >
                                    {product.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        {/* ------------------ Quantity  ------------------ */}
                        <TableCell>
                          <Input
                            type="number"
                            className="w-20" // Width for typical 3-4 digit numbers
                            value={item.quantity || ""}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                Number(e.target.value)
                              )
                            }
                            min="0"
                            disabled={!item.productId || unitType === "weight"}
                          />
                        </TableCell>
                        {/* ------------------ Weight  ------------------ */}
                        <TableCell>
                          <Input
                            type="number"
                            className="w-24" // Slightly wider for decimal numbers
                            value={item.weight || ""}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "weight",
                                Number(e.target.value)
                              )
                            }
                            min="0"
                            disabled={!item.productId || unitType === "pieces"}
                          />
                        </TableCell>
                        {/* ------------------ Rate  ------------------ */}
                        <TableCell>
                          <Input
                            type="number"
                            className="w-28" // Wider for price values
                            value={
                              Number(item.rate)
                                .toFixed(2)
                                .replace(/[.,]00$/, "") || ""
                            }
                            onChange={(e) => {
                              updateItem(index, "rate", Number(e.target.value));
                              // This will trigger recalculation in updateItem function
                            }}
                            min="0"
                          />
                        </TableCell>
                        {/* ------------------ Amount  ------------------ */}
                        <TableCell>
                          <Input
                            type="number"
                            className="w-32" // Widest for calculated amounts
                            value={
                              Number(item.amount)
                                .toFixed(2)
                                .replace(/[.,]00$/, "") || ""
                            }
                            readOnly
                          />
                        </TableCell>
                        {/* ------------------ GST Rate  ------------------ */}
                        <TableCell>
                          <Input
                            type="number"
                            className="w-16" // Narrow for percentage
                            value={item.gst || ""}
                            readOnly
                          />
                        </TableCell>
                        {/* ------------------ GST Amount  ------------------ */}
                        <TableCell>
                          <Input
                            type="number"
                            className="w-32" // Widest for calculated amounts
                            value={
                              Number(item.gstAmount)
                                .toFixed(2)
                                .replace(/[.,]00$/, "") || ""
                            }
                            readOnly
                          />
                        </TableCell>
                        {/* ------------------ Remove Item  ------------------ */}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {selectedItems.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-muted-foreground py-6"
                      >
                        No items added. Click "Add Item" to start adding
                        products.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        {selectedItems.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Discount (%)
                </label>
                <Input
                  type="number"
                  name="discount"
                  placeholder="0.00"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      discount: Number(e.target.value),
                    }))
                  }
                  min="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Amount Paid
                </label>
                <Input
                  type="number"
                  name="amountPaid"
                  placeholder="0.00"
                  value={formData.amountPaid}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      amountPaid: Number(e.target.value),
                    }))
                  }
                  min="0"
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
                        setFormData((prev) => ({
                          ...prev,
                          paymentMode: value,
                        }))
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
                        name="paymentReference"
                        placeholder="Enter reference number"
                        value={formData.paymentReference}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            paymentReference: e.target.value,
                          }))
                        }
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
                <span>₹{calculateTotals().subtotal.toFixed(2)}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm">Discount</span>
                  <span>₹{calculateTotals().discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm">GST</span>
                <span>₹{calculateTotals().totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Grand Total</span>
                <span>₹{calculateTotals().grandTotal.toFixed(2)}</span>
              </div>
              {formData.amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Amount Paid</span>
                    <span>₹{Number(formData.amountPaid).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Balance</span>
                    <span>₹{calculateTotals().balance.toFixed(2)}</span>
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
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Create Sale</Button>
      </div>

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

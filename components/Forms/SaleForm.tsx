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
import { AlertCircle, Plus, Trash2, FileSpreadsheet, Download } from "lucide-react";
import { createSale } from "@/api/sale";
import { getCustomerLedger } from "@/api/customer";
import toast from "react-hot-toast";
import CustomerForm from "./CustomerForm";
import { LedgerModal } from "./LedgerModal";
import DatePicker from "@/components/ui/DatePicker";
import ItemSelection from "../Sale/ItemSelection";
import { Customer, InventoryItem, SaleItem } from "@/types/type";
import * as XLSX from "xlsx";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  discount: number;
  amountPaid: number;
  paymentMode: "cash" | "cheque" | "online";
  paymentReference: string;
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
  const [quantityErrors, setQuantityErrors] = useState<{
    [key: number]: QuantityError;
  }>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [itemType, setItemType] = useState<string>("");
  const [uploadMode, setUploadMode] = useState<"manual" | "excel">("manual");
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

  // File headers for Excel validation
  const FILE_HEADERS = {
    pipe: [
      "Type",
      "Grade",
      "Size",
      "Guage",
      "Pieces",
      "Weight",
      "Rate",
      "Margin",
      "GST",
    ],
    sheet: [
      "Type",
      "Grade",
      "Size",
      "Guage",
      "Pieces",
      "Weight",
      "Rate",
      "Margin",
      "GST",
    ],
    fitting: [
      "Sub Category",
      "Type",
      "Size",
      "Category",
      "Pieces",
      "Weight",
      "Rate",
      "Margin",
      "GST",
    ],
    polish: [
      "Sub Category",
      "Specification",
      "Pieces",
      "Rate",
      "Margin",
      "GST",
    ],
  };

  const ITEM_TYPES = [
    { value: "pipe", label: "Pipes" },
    { value: "sheet", label: "Sheets" },
    { value: "fitting", label: "Fittings" },
    { value: "polish", label: "Polish Items" },
  ];

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

  // Helper functions for Excel processing
  const formatSize = (size: string) => {
    return size?.replace(/'/g, "'").replace(/"/g, '"') || "";
  };

  const formatItemName = (row: any, type: string) => {
    const parts = [];

    if (type === "pipe" || type === "sheet") {
      const prefix = type === "pipe" ? "Pipe" : "Sheet";
      parts.push(prefix);
      if (row["Grade"]) parts.push(row["Grade"]);
      if (row["Size"]) parts.push(formatSize(row["Size"]));
      if (row["Guage"]) parts.push(row["Guage"].toString().endsWith('G') ? row["Guage"] : `${row["Guage"]}G`);
    } else if (type === "fitting") {
      if (row["Sub Category"]) parts.push(row["Sub Category"]);
      if (row["Type"]) parts.push(row["Type"]);
      if (row["Size"]) parts.push(formatSize(row["Size"]));
      if (row["Category"]) parts.push(row["Category"]);
    } else if (type === "polish") {
      if (row["Sub Category"]) parts.push(row["Sub Category"]);
      if (row["Specification"]) parts.push(row["Specification"]);
    }

    return parts.filter(Boolean).join("-");
  };

  const shouldUseWeight = (type: string, subCategory?: string) => {
    return (
      type === "pipe" ||
      type === "sheet" ||
      (type === "fitting" && subCategory === "Bush")
    );
  };

  const validateFileFormat = (headers: string[], type: string): boolean => {
    const expectedHeaders = FILE_HEADERS[type as keyof typeof FILE_HEADERS];
    if (!expectedHeaders) return false;

    const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
    const normalizedExpected = expectedHeaders.map((h) =>
      h.trim().toLowerCase()
    );

    return normalizedExpected.every((header) =>
      normalizedHeaders.includes(header)
    );
  };

  const findItemInInventory = (name: string, type: string): InventoryItem | undefined => {
    return items.find((item) => {
      // Try exact name match first
      if (item.name === name) return true;
      
      // Try matching with different formatting
      const normalizedItemName = item.name.toLowerCase().replace(/\s+/g, "");
      const normalizedSearchName = name.toLowerCase().replace(/\s+/g, "");
      
      return normalizedItemName === normalizedSearchName;
    });
  };

  const processExcelData = async (file: File) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headers = jsonData[0] as string[];

        if (!validateFileFormat(headers, itemType)) {
          toast.error(
            `Invalid file format for ${itemType} items. Please check the sample file.`
          );
          setSelectedFile(null);
          return;
        }

        const rows = XLSX.utils.sheet_to_json(worksheet);
        const processedItems: SaleItem[] = [];
        const notFoundItems: string[] = [];

        rows.forEach((row: any) => {
          let currentType = itemType;
          if (itemType === "pipe" || itemType === "sheet") {
            currentType =
              row["Type"]?.toLowerCase() === "sheet" ? "sheet" : "pipe";
          }

          const name = formatItemName(row, currentType);
          const inventoryItem = findItemInInventory(name, currentType);

          if (!inventoryItem) {
            notFoundItems.push(name);
            return;
          }

          const pieces = Number(row["Pieces"]) || undefined;
          const weight = Number(row["Weight"]) || undefined;
          const rate = Number(row["Rate"]) || inventoryItem.purchaseRate || 0;
          const margin = Number(row["Margin"]) || 0; // Now absolute margin value
          const gst = Number(row["GST"]) || inventoryItem.gst || 0;

          const sellingPrice = rate + margin; // Add absolute margin to base rate
          const quantity = shouldUseWeight(itemType, row["Sub Category"])
            ? weight || 0
            : pieces || 0;
          const amount = quantity * sellingPrice;
          const gstAmount = (amount * gst) / 100;

          const saleItem: SaleItem = {
            itemId: inventoryItem._id,
            type: currentType,
            name: inventoryItem.name,
            grade: row["Grade"] || "", // Only for pipe/sheet items
            size: row["Size"] ? formatSize(row["Size"]) : "",
            gauge: row["Guage"] ? row["Guage"].toString().replace('G', '') : "",
            subCategory: row["Sub Category"] || "",
            specification: row["Specification"] || "",
            quantity: inventoryItem.unitType === "pieces" ? pieces : undefined,
            weight: inventoryItem.unitType === "weight" ? weight : undefined,
            pieces: pieces, // Always store pieces for tracking
            rate: rate,
            margin: margin,
            sellingPrice: sellingPrice,
            amount: amount,
            gst: gst,
            gstAmount: gstAmount,
          };

          // Check stock availability
          const stockValidation = checkStockAvailability(inventoryItem, saleItem);
          if (!stockValidation.valid) {
            toast.error(`${inventoryItem.name}: ${stockValidation.message}`);
            return;
          }

          processedItems.push(saleItem);
        });

        if (notFoundItems.length > 0) {
          toast.error(
            `The following items were not found in inventory: ${notFoundItems.join(", ")}`
          );
        }

        if (processedItems.length === 0) {
          toast.error("No valid items found in the Excel file");
          setSelectedFile(null);
          return;
        }

        setSelectedItems(processedItems);
        toast.success(`Successfully loaded ${processedItems.length} items`);
      } catch (error) {
        console.error("Error processing file:", error);
        toast.error("Error processing file. Please check the format.");
        setSelectedFile(null);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      await processExcelData(file);
    }
  };

  const getSampleFileUrl = (type: string) => {
    switch (type) {
      case "pipe":
      case "sheet":
        return `/Sales-Pipe_Sheet.xlsx`;
      case "fitting":
        return `/Sales-Fitting.xlsx`;
      case "polish":
        return `/Sales-Polish Items.xlsx`;
      default:
        return "";
    }
  };

  const downloadSampleFile = () => {
    if (!itemType) {
      toast.error("Please select an item type first");
      return;
    }

    const url = getSampleFileUrl(itemType);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = url.split("/").pop() || "";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    const newQuantityErrors = { ...quantityErrors };

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
        currentItem.margin = 0;
        currentItem.sellingPrice = selectedProduct.purchaseRate || 0;
        currentItem.type = selectedProduct.itemType;

        // Reset quantity/weight based on unit type
        if (selectedProduct.unitType === "weight") {
          currentItem.weight = 0;
          currentItem.quantity = undefined;
        } else {
          currentItem.quantity = 1;
          currentItem.weight = undefined;
        }

        // Check available stock for initial quantity
        const isValid = checkStockAvailability(selectedProduct, currentItem);
        if (!isValid.valid) {
          newQuantityErrors[index] = {
            hasError: true,
            message: isValid.message,
          };
        } else {
          delete newQuantityErrors[index];
        }

        // Calculate initial amount based on unit type
        const quantity =
          selectedProduct.unitType === "weight"
            ? currentItem.weight || 0
            : currentItem.quantity || 0;
        currentItem.amount = quantity * currentItem.sellingPrice;
        currentItem.gstAmount = (currentItem.amount * currentItem.gst) / 100;
      }
    }

    // If quantity or weight changed, validate stock
    if ("quantity" in updatedItem || "weight" in updatedItem) {
      const selectedProduct = items.find(
        (item) => item._id === currentItem.itemId
      );
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
        currentItem.sellingPrice = Math.min(
          999999.99,
          Math.max(
            0,
            parseFloat(
              (currentItem.rate + (currentItem.margin || 0)).toFixed(2)
            )
          )
        );

        const quantity =
          selectedProduct.unitType === "weight"
            ? currentItem.weight || 0
            : currentItem.quantity || 0;

        currentItem.amount = Math.min(
          999999.99,
          Math.max(
            0,
            parseFloat((quantity * currentItem.sellingPrice).toFixed(2))
          )
        );
        currentItem.gstAmount = (currentItem.amount * currentItem.gst) / 100;
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
    // Calculate subtotal from all items, ensuring to handle undefined values
    const subtotal = selectedItems.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );

    // Calculate total tax from all items
    const totalTax = selectedItems.reduce(
      (sum, item) => sum + (item.gstAmount || 0),
      0
    );

    // Calculate discount amount
    const discountAmount = (subtotal * Number(formData.discount || 0)) / 100;

    // Calculate grand total
    const grandTotal = subtotal + totalTax - discountAmount;

    // Calculate balance after payment
    const balance = grandTotal - Number(formData.amountPaid || 0);

    return {
      subtotal,
      totalTax,
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
      if (missingFields.length > 0) {
        toast.error(
          `Please fill in the following required field${
            missingFields.length > 1 ? "s" : ""
          }: ${missingFields.join(", ")}`
        );
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
          itemId: item.itemId,
          itemModel: getItemModel(item.type),
          name: item.name,
          type: item.type,
          quantity: item.quantity,
          weight: item.weight,
          pieces: item.pieces || item.quantity, // Include pieces for tracking
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
    setSelectedFile(null);
    setItemType("");
    setUploadMode("manual");
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
            <div className="flex gap-2">
              <Select 
                value={uploadMode} 
                onValueChange={(value: "manual" | "excel") => setUploadMode(value)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                  <SelectItem value="excel">Excel Upload</SelectItem>
                </SelectContent>
              </Select>
              {uploadMode === "manual" && (
                <Button onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
              )}
            </div>
          </div>

          {/* Excel Upload Section */}
          {uploadMode === "excel" && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Select Item Type*
                      </label>
                      <Select value={itemType} onValueChange={setItemType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select item type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEM_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button
                        variant="outline"
                        onClick={downloadSampleFile}
                        disabled={!itemType}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                  </div>

                  {itemType && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium mb-1 block">
                        Upload Excel File
                      </label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileSelect}
                          className="flex-1"
                        />
                        {selectedFile && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileSpreadsheet className="h-4 w-4" />
                            {selectedFile.name}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload an Excel file with items to add to the sale. The file must
                        include columns for item details, quantities, rates, margins (absolute value in ₹), and GST.
                        Selling Price = Rate + Margin
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Display Items Table for Excel Upload */}
          {uploadMode === "excel" && selectedItems.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Qty/Weight</TableHead>
                      <TableHead>Rate (₹)</TableHead>
                      <TableHead>Margin (₹)</TableHead>
                      <TableHead>Selling Price</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>GST (%)</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          {item.weight ? `${item.weight} kg` : `${item.quantity} pcs`}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => {
                              const newRate = Number(e.target.value) || 0;
                              const newItems = [...selectedItems];
                              newItems[index] = {
                                ...newItems[index],
                                rate: newRate,
                                sellingPrice: newRate + (newItems[index].margin || 0),
                              };
                              // Recalculate amount
                              const quantity = item.weight || item.quantity || 0;
                              newItems[index].amount = quantity * newItems[index].sellingPrice;
                              newItems[index].gstAmount = (newItems[index].amount * newItems[index].gst) / 100;
                              setSelectedItems(newItems);
                            }}
                            className="w-20"
                            min="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.margin}
                            onChange={(e) => {
                              const newMargin = Number(e.target.value) || 0;
                              const newItems = [...selectedItems];
                              newItems[index] = {
                                ...newItems[index],
                                margin: newMargin,
                                sellingPrice: newItems[index].rate + newMargin,
                              };
                              // Recalculate amount
                              const quantity = item.weight || item.quantity || 0;
                              newItems[index].amount = quantity * newItems[index].sellingPrice;
                              newItems[index].gstAmount = (newItems[index].amount * newItems[index].gst) / 100;
                              setSelectedItems(newItems);
                            }}
                            className="w-20"
                            min="0"
                          />
                        </TableCell>
                        <TableCell>₹{item.sellingPrice.toFixed(2)}</TableCell>
                        <TableCell>₹{item.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.gst}
                            onChange={(e) => {
                              const newGst = Number(e.target.value) || 0;
                              const newItems = [...selectedItems];
                              newItems[index] = {
                                ...newItems[index],
                                gst: newGst,
                                gstAmount: (newItems[index].amount * newGst) / 100,
                              };
                              setSelectedItems(newItems);
                            }}
                            className="w-16"
                            min="0"
                            max="100"
                          />
                        </TableCell>
                        <TableCell>
                          ₹{(item.amount + item.gstAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItems(items => items.filter((_, i) => i !== index));
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Manual Entry Items */}
          {uploadMode === "manual" && selectedItems.map((item, index) => (
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
                quantityErrors={quantityErrors}
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
              {uploadMode === "manual" 
                ? 'No items added. Click "Add Item" to start adding products.'
                : 'No items uploaded. Please select item type and upload Excel file.'}
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

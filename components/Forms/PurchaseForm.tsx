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
import { Download, FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import VendorForm from "@/components/Forms/VendorForm";
import * as XLSX from "xlsx";
import { createPurchase } from "@/api/purchase";
import { LedgerModal, TransactionData } from "./LedgerModal";
import { getVendorLedger } from "@/api/transaction";
// import { format as dateFormat } from "date-fns";
import DatePicker from "../ui/DatePicker";
import SummaryPurchase from "../Purchase/SummaryPurchase";

interface Vendor {
  id: string;
  name: string;
  gstin: string;
  _id: string;
}

// Update the form data interface
export interface PurchaseFormData {
  vendorId: string;
  date: Date;
  ewayBillNo: string;
  invoiceNo: string;
  paymentTerms: string;
  destination: string;
  vehicleNo: string;
  freight: number;
  tcs: number;
  discount: number;
  amountPaid: number;
  paymentMode: "cash" | "cheque" | "online";
  paymentReference: string;
}

interface ProcessedItem {
  name: string;
  grade?: string;
  pieces?: number;
  weight?: number;
  size?: string;
  gauge?: string;
  category?: string;
  rate: number;
  amount: number;
  gst: number;
  gstAmount: number;
  margin?: number;
  rawData: any;
  type?: string;
  subCategory?: string;
  fittingType?: string;
  specification?: string;
}

interface ProcessedFileData {
  items: ProcessedItem[];
  totalAmount: number;
  totalTax: number;
  netAmount: number;
}

interface PurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: Vendor[];
  isLoading: boolean;
  onSuccess?: () => void;
  fetchVendors: () => void;
}

const ITEM_TYPES = [
  { value: "pipe", label: "Pipes" },
  { value: "sheet", label: "Sheets" },
  { value: "fitting", label: "Fittings" },
  { value: "polish", label: "Polish Items" },
];

// Updated file headers based on your CSV files
const FILE_HEADERS = {
  pipe: [
    "Type",
    "Grade",
    "Size",
    "Guage",
    "Pieces",
    "Weight",
    "Rate",
    "GST",
    // "Margin (%)",
  ],
  sheet: [
    "Type",
    "Grade",
    "Size",
    "Guage",
    "Pieces",
    "Weight",
    "Rate",
    "GST",
    // "Margin (%)",
  ],
  fitting: [
    "Sub Category",
    "Grade",
    "Type",
    "Size",
    "Category",
    "Pieces",
    "Weight",
    "Rate",
    "GST",
    // "Margin (%)",
  ],
  polish: [
    "Sub Category",
    "Specification",
    "Pieces",
    "Rate",
    "GST",
    // "Margin (%)",
  ],
};

const PurchaseModal = ({
  open,
  onOpenChange,
  vendors,
  isLoading,
  onSuccess,
  fetchVendors,
}: PurchaseModalProps) => {
  const [vendorOpen, setVendorOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [itemType, setItemType] = useState<string>("");
  const [processedData, setProcessedData] = useState<{
    items: any[];
    totalAmount: number;
    totalTax: number;
    netAmount: number;
  } | null>(null);

  const [showLedger, setShowLedger] = useState(false);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  // const [date, setDate] = React.useState<Date>();

  const [formData, setFormData] = useState<PurchaseFormData>({
    vendorId: "",
    date: new Date(),
    ewayBillNo: "",
    invoiceNo: "",
    paymentTerms: "",
    destination: "",
    vehicleNo: "",
    freight: 0,
    tcs: 0,
    discount: 0,
    amountPaid: 0,
    paymentMode: "cash",
    paymentReference: "",
  });

  const handleViewLedger = async (vendorId: string) => {
    try {
      const response = await getVendorLedger(vendorId);
      if (response?.data.success) {
        setTransactions(response.data.data);
        setShowLedger(true);
      }
    } catch (error) {
      toast.error("Failed to fetch ledger");
    }
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

  const formatItemName = (row: any, type: string) => {
    const parts = [];

    if (type === "pipe" || type === "sheet") {
      // Explicitly use the itemType
      const prefix = type === "pipe" ? "Pipe" : "Sheet";
      parts.push(prefix);
      if (row["Grade"]) parts.push(row["Grade"]);
      if (row["Size"]) parts.push(formatSize(row["Size"]));
      if (row["Guage"]) parts.push(`${row["Guage"]}G`);
    } else if (type === "fitting") {
      if (row["Sub Category"]) parts.push(row["Sub Category"]);
      if (row["Grade"]) parts.push(row["Grade"]); // Add grade
      if (row["Type"]) parts.push(row["Type"]);
      if (row["Size"]) parts.push(formatSize(row["Size"]));
      if (row["Category"]) parts.push(row["Category"]);
    } else if (type === "polish") {
      if (row["Sub Category"]) parts.push(row["Sub Category"]);
      if (row["Specification"]) parts.push(row["Specification"]);
    }

    return parts.filter(Boolean).join("-");
  };

  const formatCurrency = (amount: number) => {
    // Convert to 2 decimal places first
    const roundedAmount = Number(Number(amount).toFixed(2));

    // Check if it's a whole number
    const isWholeNumber = roundedAmount % 1 === 0;
    // Format accordingly
    return `₹${
      isWholeNumber ? Math.round(roundedAmount) : roundedAmount?.toFixed(2)
    }`;
  };

  const formatSize = (size: string) => {
    return size?.replace(/'/g, "'").replace(/"/g, '"') || "";
  };

  const shouldUseWeight = (type: string, subCategory?: string) => {
    return (
      type === "pipe" ||
      type === "sheet" ||
      (type === "fitting" && subCategory === "Bush")
    );
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
        const processedItems = rows.map((row: any): ProcessedItem => {
          let currentType = itemType;
          if (itemType === "pipe" || itemType === "sheet") {
            // For pipe/sheet, get type from Excel
            currentType =
              row["Type"]?.toLowerCase() === "sheet" ? "sheet" : "pipe";
          }
          const name = formatItemName(row, currentType);
          const grade = row["Grade"];
          const pieces = Number(row["Pieces"]) || undefined;
          const weight = Number(row["Weight"]) || undefined;
          const rate = Number(row["Rate"]) || 0;
          const gst = Number(row["GST"]) || 0;
          const specification = row["Specification"] || "";

          // Calculate amount based on weight for specific items
          const amount = shouldUseWeight(itemType, row["Sub Category"])
            ? (weight || 0) * rate
            : (pieces || 0) * rate;

          const gstAmount = (amount * gst) / 100;

          // For fitting items, store Type in a separate field
          const typeValue = itemType === "fitting" ? row["Type"] : undefined;

          if (itemType === "fitting") {
            return {
              name,
              pieces,
              grade: row["Grade"], // Add grade for fittings
              weight,
              size: row["Size"] ? formatSize(row["Size"]) : undefined,
              category: row["Category"] || undefined,
              rate,
              amount,
              gst,
              gstAmount,
              rawData: row,
              type: itemType,
              subCategory: row["Sub Category"],
              fittingType: typeValue,
            };
          }

          return {
            name,
            pieces,
            grade,
            weight,
            size: row["Size"] ? formatSize(row["Size"]) : undefined,
            gauge: row["Guage"] || undefined,
            category: row["Category"] || undefined,
            rate,
            amount,
            gst,
            gstAmount,
            // margin: Number(row["Margin (%)"]) || 0,
            rawData: row,
            type: currentType,
            subCategory: row["Sub Category"],
            fittingType: typeValue,
            specification,
          };
        });

        const totalAmount = processedItems.reduce(
          (sum, item) => sum + item.amount,
          0
        );
        const totalTax = processedItems.reduce(
          (sum, item) => sum + item.gstAmount,
          0
        );

        setProcessedData({
          items: processedItems,
          totalAmount,
          totalTax,
          netAmount: totalAmount + totalTax,
        });
      } catch (error) {
        console.error("Error processing file:", error);
        toast.error("Error processing file. Please check the format.");
        setSelectedFile(null);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (e.target.type === "number" && Number(value) < 0) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      await processExcelData(file);
    }
  };

  const handleVendorSelect = (value: string) => {
    setFormData((prev) => ({ ...prev, vendorId: value }));
  };

  const calculateFinalAmounts = () => {
    if (!processedData) return null;

    const discountAmount =
      (processedData.totalAmount * Number(formData.discount)) / 100;
    const afterDiscount = processedData.totalAmount - discountAmount;
    const finalTax = processedData.totalTax;
    const freightAmount = Number(formData.freight) || 0;
    const tcsAmount = Number(formData.tcs) || 0;
    const grandTotal = afterDiscount + finalTax + freightAmount + tcsAmount;
    const balance = grandTotal - Number(formData.amountPaid);

    return {
      discountAmount,
      afterDiscount,
      finalTax,
      freightAmount,
      tcsAmount,
      grandTotal,
      balance,
    };
  };
  const getSampleFileUrl = (type: string) => {
    // const baseUrl = "/";
    switch (type) {
      case "pipe":
      case "sheet":
        return `/Items-Pipe_Sheet.xlsx`;
      case "fitting":
        return `/Items-Fitting.xlsx`;
      case "polish":
        return `/Items-Polish Items.xlsx`;
      default:
        return "";
    }
  };

  const handleSubmit = async () => {
    try {
      const requiredFields = [
        { name: "vendorId", label: "Vendor" },
        { name: "date", label: "Date" },
        { name: "invoiceNo", label: "Invoice No" },
      ];
      const missingFields = requiredFields.filter(
        (field) => !formData[field.name]
      );
      if (missingFields.length > 0) {
        toast.error(
          `Please fill in the following required field${
            missingFields.length > 1 ? "s" : ""
          }: ${missingFields.map((field) => field.label).join(", ")}`
        );
        return;
      }

      if (!processedData?.items.length) {
        toast.error("Please upload and process the purchase list");
        return;
      }

      const calculations = calculateFinalAmounts();
      if (!calculations) return;

      // Transform items to match backend schema
      const transformedItems = processedData.items.map((item) => {
        const baseItem = {
          name: item.name,
          pieces: item.pieces,
          weight: item.weight,
          rate: item.rate,
          amount: item.amount,
          gst: item.gst,
          gstAmount: item.gstAmount,
          margin: item.margin || 0,
        };

        if (itemType === "polish") {
          return {
            ...baseItem,
            type: "polish",
            specification: item.specification,
            subCategory: item.subCategory,
          };
        }

        if (itemType === "fitting") {
          return {
            ...baseItem,
            type: "fitting",
            grade: item.grade,
            size: item.size,
            category: item.category,
            subCategory: item.subCategory,
            fittingType: item.fittingType,
          };
        }

        // For pipe/sheet
        return {
          ...baseItem,
          type:
            item.rawData["Type"]?.toLowerCase() === "sheet" ? "sheet" : "pipe",
          size: item.size,
          gauge: item.gauge,
          grade: item.grade,
        };
      });

      const purchaseData = {
        vendorId: formData.vendorId,
        date: formData.date,
        ewayBillNo: formData.ewayBillNo,
        invoiceNo: formData.invoiceNo,
        paymentTerms: formData.paymentTerms,
        destination: formData.destination,
        vehicleNo: formData.vehicleNo,
        items: transformedItems,
        discount: Number(formData.discount),
        taxableAmount: processedData.totalAmount,
        discountAmount: calculations.discountAmount,
        totalTax: processedData.totalTax,
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
        balanceAmount: calculations.balance,
      };

      const response = await createPurchase({
        ...purchaseData,
        freight: formData.freight,
        tcs: formData.tcs,
        amountPaid: formData.amountPaid,
        paymentMode: formData.paymentMode,
        paymentReference: formData.paymentReference,
      });

      if (response?.data.statusCode === 201) {
        toast.success("Purchase created successfully");
        onOpenChange(false);
        onSuccess?.();
        resetForm();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create purchase"
      );
    }
  };

  const resetForm = () => {
    setFormData({
      vendorId: "",
      date: new Date(),
      ewayBillNo: "",
      invoiceNo: "",
      paymentTerms: "",
      destination: "",
      vehicleNo: "",
      freight: 0,
      tcs: 0,
      discount: 0,
      amountPaid: 0,
      paymentMode: "cash",
      paymentReference: "",
    });
    setSelectedFile(null);
    setProcessedData(null);
    setItemType("");
  };

  const renderTableColumns = () => {
    const columns = [];
    columns.push(<TableHead key="details">Details</TableHead>);

    if (itemType === "pipe" || itemType === "sheet") {
      columns.push(
        <TableHead key="grade" className="text-right">
          Grade
        </TableHead>,
        <TableHead key="size" className="text-right">
          Size
        </TableHead>,
        <TableHead key="gauge" className="text-right">
          Gauge
        </TableHead>
      );
    } else if (itemType === "fitting") {
      columns.push(
        <TableHead key="size" className="text-right">
          Grade
        </TableHead>,
        <TableHead key="size" className="text-right">
          Size
        </TableHead>,
        <TableHead key="type" className="text-right">
          Type
        </TableHead>,
        <TableHead key="category" className="text-right">
          Category
        </TableHead>
      );
    } else if (itemType === "polish") {
      columns.push(
        <TableHead key="specification" className="text-right">
          Specification
        </TableHead>
      );
    }

    columns.push(
      <TableHead key="pieces" className="text-right">
        Pieces
      </TableHead>,
      <TableHead key="weight" className="text-right">
        Weight
      </TableHead>,
      <TableHead key="rate" className="text-right">
        Rate
      </TableHead>,
      <TableHead key="amount" className="text-right">
        Amount
      </TableHead>,
      <TableHead key="gst" className="text-right">
        GST %
      </TableHead>,
      <TableHead key="gstAmount" className="text-right">
        GST Amount
      </TableHead>
    );

    return columns;
  };

  const renderTableCell = (item: ProcessedItem) => {
    const cells = [];
    cells.push(<TableCell key="details">{item.name}</TableCell>);

    if (itemType === "pipe" || itemType === "sheet") {
      cells.push(
        <TableCell key="grade" className="text-right">
          {item.grade || "-"}
        </TableCell>,
        <TableCell key="size" className="text-right">
          {item.size || "-"}
        </TableCell>,
        <TableCell key="gauge" className="text-right">
          {item.gauge || "-"}
        </TableCell>
      );
    } else if (itemType === "fitting") {
      cells.push(
        <TableCell key="size" className="text-right">
          {item.grade || "-"}
        </TableCell>,
        <TableCell key="size" className="text-right">
          {item.size || "-"}
        </TableCell>,
        <TableCell key="category" className="text-right">
          {item.rawData.Type || "-"}
        </TableCell>,
        <TableCell key="category" className="text-right">
          {item.category || "-"}
        </TableCell>
      );
    } else if (itemType === "polish") {
      cells.push(
        <TableCell key="size" className="text-right">
          {item.specification || "-"}
        </TableCell>
      );
    }

    cells.push(
      <TableCell key="pieces" className="text-right">
        {item.pieces || "-"}
      </TableCell>,
      <TableCell key="weight" className="text-right">
        {item.weight ? `${item.weight.toFixed(2)} kg` : "-"}
      </TableCell>,
      <TableCell key="rate" className="text-right">
        {formatCurrency(item.rate)}
      </TableCell>,
      <TableCell key="amount" className="text-right">
        {formatCurrency(item.amount)}
      </TableCell>,
      <TableCell key="gst" className="text-right">
        {item.gst}%
      </TableCell>,
      <TableCell key="gstAmount" className="text-right">
        {formatCurrency(item.gstAmount)}
      </TableCell>
    );

    return cells;
  };

  return (
    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Add New Purchase</DialogTitle>
        <DialogDescription>
          Upload purchase details and enter additional information
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 py-4">
        {/* Basic Purchase Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">
                Vendor Name*
              </label>
              <Select
                value={formData.vendorId}
                onValueChange={handleVendorSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.length === 0 ? (
                    <SelectItem value="No Vendors" disabled>
                      No vendors found
                    </SelectItem>
                  ) : (
                    vendors.map((vendor) => (
                      <SelectItem key={vendor._id} value={vendor._id}>
                        {vendor.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {formData.vendorId && (
                <Button
                  variant="outline"
                  className="mt-2 bg-accent text-white hover:bg-accent border-0 text-[13px]"
                  size="xs"
                  onClick={() => handleViewLedger(formData.vendorId)}
                >
                  View Ledger
                </Button>
              )}
            </div>
            <Dialog open={vendorOpen} onOpenChange={setVendorOpen}>
              <DialogTrigger asChild>
                <Button className="mt-6" variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Vendor</DialogTitle>
                </DialogHeader>
                <VendorForm
                  onSuccess={() => {
                    setVendorOpen(false);
                    fetchVendors();
                  }}
                  onCancel={() => setVendorOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Purchase Date*
            </label>
            <DatePicker
              date={formData?.date}
              onDateChange={(newDate) => {
                // setDate(newDate);
                if (newDate) {
                  setFormData((prev) => ({
                    ...prev,
                    date: newDate,
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
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              E-way Bill No.
            </label>
            <Input
              name="ewayBillNo"
              placeholder="Enter e-way bill number"
              value={formData.ewayBillNo}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Invoice No*
            </label>
            <Input
              name="invoiceNo"
              placeholder="Enter invoice number"
              value={formData.invoiceNo}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Item Type and File Upload */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Item Type*</label>
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

          {itemType && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Purchase List</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getSampleFileUrl(itemType))}
                >
                  <Download className="h-4 w-4 mr-2" /> Download Sample
                </Button>
              </div>

              {!processedData ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <FileSpreadsheet className="h-12 w-12 text-gray-400 mb-4" />
                        <span className="text-sm font-medium mb-2">
                          {selectedFile
                            ? selectedFile.name
                            : "Upload Purchase Excel"}
                        </span>
                        <span className="text-xs text-gray-500">
                          Drag and drop or click to select
                        </span>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Processed Items</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setProcessedData(null);
                        setSelectedFile(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Clear
                    </Button>
                  </div>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>{renderTableColumns()}</TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedData.items.map((item, index) => (
                          <TableRow key={index}>
                            {renderTableCell(item)}
                          </TableRow>
                        ))}
                        <TableRow className="font-medium">
                          <TableCell colSpan={renderTableColumns().length - 3}>
                            Total
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(processedData.totalAmount)}
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(processedData.totalTax)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment Details */}
        {processedData && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Extra Discount (%)
                </label>
                <Input
                  type="number"
                  name="discount"
                  placeholder="0.00"
                  value={formData.discount}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Payment Mode
                </label>
                <Select
                  value={formData.paymentMode}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentMode: value as "cash" | "cheque" | "online",
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
                    onChange={handleInputChange}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Payment Terms
                </label>
                <Input
                  name="paymentTerms"
                  placeholder="Enter payment terms"
                  value={formData.paymentTerms}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Freight
                </label>
                <Input
                  type="number"
                  name="freight"
                  placeholder="0.00"
                  value={formData.freight}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  TCS Amount
                </label>
                <Input
                  type="number"
                  name="tcs"
                  placeholder="0.00"
                  value={formData.tcs}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            {/* Summary */}
            <SummaryPurchase
              calculateFinalAmounts={calculateFinalAmounts}
              processedData={processedData}
              formData={formData}
              formatCurrency={formatCurrency}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Submit</Button>
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
};

export default PurchaseModal;

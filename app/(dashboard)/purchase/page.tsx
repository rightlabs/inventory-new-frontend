"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Download, FileSpreadsheet, Plus } from "lucide-react";

interface Party {
  id: number;
  name: string;
  gstin?: string;
}

interface Purchase {
  id: string;
  date: string;
  invoiceNo: string;
  vendorName: string;
  amount: number;
  gst: number;
  status: "pending" | "received";
  paymentStatus: "unpaid" | "partial" | "paid";
}

export default function PurchasesPage() {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Sample data
  const parties: Party[] = [
    { id: 1, name: "Ashutosh Ji", gstin: "09AAACH7409R1ZZ" },
    { id: 2, name: "Vendor 2", gstin: "07BBBCH8809R1ZZ" },
  ];

  const purchases: Purchase[] = [
    {
      id: "PO-2024-001",
      date: "2024-03-20",
      invoiceNo: "INV-001",
      vendorName: "Ashutosh Ji",
      amount: 235000,
      gst: 42300,
      status: "received",
      paymentStatus: "paid",
    },
    {
      id: "PO-2024-002",
      date: "2024-03-19",
      invoiceNo: "INV-002",
      vendorName: "Vendor 2",
      amount: 185000,
      gst: 33300,
      status: "pending",
      paymentStatus: "unpaid",
    },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: Purchase["status"] }) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      received: "bg-green-100 text-green-800",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Payment badge component
  const PaymentBadge = ({ status }: { status: Purchase["paymentStatus"] }) => {
    const styles = {
      unpaid: "bg-red-100 text-red-800",
      partial: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your purchase orders and transactions
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="mr-2 h-4 w-4" /> Add Purchase
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Purchase</DialogTitle>
              <DialogDescription>
                Upload purchase details and enter additional information
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Purchase Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Vendor Selection with Add Button */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">
                      Vendor Name*
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {parties.map((party) => (
                          <SelectItem
                            key={party.id}
                            value={party.id.toString()}
                          >
                            {party.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="mt-6" variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Purchase Date*
                  </label>
                  <Input type="date" />
                </div>

                {/* E-way Bill Number */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    E-way Bill No.*
                  </label>
                  <Input placeholder="Enter e-way bill number" />
                </div>

                {/* Invoice Number */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Invoice No*
                  </label>
                  <Input placeholder="Enter invoice number" />
                </div>

                {/* Terms of Payment */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Terms of Payment
                  </label>
                  <Input placeholder="Enter payment terms" />
                </div>

                {/* Destination */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Destination*
                  </label>
                  <Input placeholder="Enter destination" />
                </div>

                {/* Vehicle Number */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Vehicle No
                  </label>
                  <Input placeholder="Enter vehicle number" />
                </div>
              </div>

              {/* File Upload Section */}
              <div>
                <label className="text-sm font-medium block mb-2">
                  Purchase List
                </label>
                <Card className="mt-0">
                  <CardContent className="pt-3 p-3">
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center">
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
              </div>

              {/* Tax and Discount Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Extra Discount (%)
                  </label>
                  <Input type="number" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Tax (%)
                  </label>
                  <Input type="number" placeholder="0.00" />
                </div>
              </div>

              {/* Summary Section */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Taxable Amount</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Discount Amount</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">CGST</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">SGST</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">IGST</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Grand Total</span>
                  <span>₹0.00</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button>Submit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Purchase Orders Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold">
                Purchase Orders
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage your purchase orders
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    PO Number
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Invoice No
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Vendor
                  </th>
                  <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                    GST
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle">{purchase.date}</td>
                    <td className="p-4 align-middle font-medium">
                      {purchase.id}
                    </td>
                    <td className="p-4 align-middle">{purchase.invoiceNo}</td>
                    <td className="p-4 align-middle">{purchase.vendorName}</td>
                    <td className="p-4 align-middle text-right">
                      ₹{purchase.amount.toLocaleString()}
                    </td>
                    <td className="p-4 align-middle text-right">
                      ₹{purchase.gst.toLocaleString()}
                    </td>
                    <td className="p-4 align-middle">
                      <StatusBadge status={purchase.status} />
                    </td>
                    <td className="p-4 align-middle">
                      <PaymentBadge status={purchase.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

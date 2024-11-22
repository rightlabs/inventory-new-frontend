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
import {
  Plus,
  Trash2,
  IndianRupee,
  Download,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

// TypeScript interfaces
interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  rate: number;
  unit: string;
}

interface Customer {
  id: number;
  name: string;
  gstin?: string;
  creditLimit: number;
  currentBalance: number;
  paymentTerms?: string;
}

interface SaleItem {
  id: number;
  productId: string;
  quantity: number;
  weight: number;
  rate: number;
  amount: number;
}

interface Sale {
  id: string;
  date: string;
  customerId: number;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  gst: number;
  total: number;
  status: "draft" | "processing" | "completed" | "cancelled";
  paymentStatus: "pending" | "partial" | "paid";
}

export default function SalesPage() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");

  // Sample products data
  const sampleProducts: Product[] = [
    {
      id: "1",
      code: "PIP-304-80x80-G14",
      name: "Pipe 304 80x80 14G",
      category: "PIPE",
      rate: 244.36,
      unit: "pcs",
    },
    {
      id: "2",
      code: "PIP-304-50x50-G16",
      name: "Pipe 304 50x50 16G",
      category: "PIPE",
      rate: 170.36,
      unit: "pcs",
    },
  ];

  // Sample customers data
  const sampleCustomers: Customer[] = [
    {
      id: 1,
      name: "Customer 1",
      gstin: "09AAACH7409R1ZZ",
      creditLimit: 50000,
      currentBalance: 15000,
      paymentTerms: "30 days",
    },
    {
      id: 2,
      name: "Customer 2",
      gstin: "07BBBCH8809R1ZZ",
      creditLimit: 100000,
      currentBalance: 45000,
      paymentTerms: "15 days",
    },
  ];

  // Sample sales data
  const sales: Sale[] = [
    {
      id: "SO-2024-001",
      date: "2024-03-20",
      customerId: 1,
      customerName: "Customer 1",
      items: [
        {
          id: 1,
          productId: "1",
          quantity: 20,
          weight: 452.0,
          rate: 244.36,
          amount: 4887.2,
        },
      ],
      subtotal: 4887.2,
      gst: 879.7,
      total: 5766.9,
      status: "completed",
      paymentStatus: "paid",
    },
    {
      id: "SO-2024-002",
      date: "2024-03-19",
      customerId: 2,
      customerName: "Customer 2",
      items: [
        {
          id: 1,
          productId: "2",
          quantity: 50,
          weight: 1250.0,
          rate: 170.36,
          amount: 8518.0,
        },
      ],
      subtotal: 8518.0,
      gst: 1533.24,
      total: 10051.24,
      status: "processing",
      paymentStatus: "pending",
    },
  ];

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        productId: "",
        quantity: 0,
        weight: 0,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    // Recalculate amount if quantity or rate changes
    if (field === "quantity" || field === "rate") {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }

    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const gst = subtotal * 0.18;
    return {
      subtotal,
      gst,
      total: subtotal + gst,
    };
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: Sale["status"] }) => {
    const styles = {
      draft: "bg-gray-100 text-gray-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Payment status badge component
  const PaymentBadge = ({ status }: { status: Sale["paymentStatus"] }) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      partial: "bg-blue-100 text-blue-800",
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
          <h1 className="text-3xl font-bold tracking-tight">Sales Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage your sales orders
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="mr-2 h-4 w-4" /> Create Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Sale</DialogTitle>
              <DialogDescription>
                Add items and enter sale details
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Customer and Basic Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">
                      Customer*
                    </label>
                    <Select onValueChange={setSelectedCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {sampleCustomers.map((customer) => (
                          <SelectItem
                            key={customer.id}
                            value={customer.id.toString()}
                          >
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCustomer && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Credit Limit: ₹
                        {sampleCustomers
                          .find((c) => c.id.toString() === selectedCustomer)
                          ?.creditLimit.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button className="mt-6" variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Date*
                  </label>
                  <Input
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              {/* Items Table */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Items</CardTitle>
                    <Button onClick={addItem} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Select
                              onValueChange={(value) => {
                                const product = sampleProducts.find(
                                  (p) => p.id === value
                                );
                                if (product) {
                                  updateItem(index, "productId", value);
                                  updateItem(index, "rate", product.rate);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {sampleProducts.map((product) => (
                                  <SelectItem
                                    key={product.id}
                                    value={product.id}
                                  >
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="Qty"
                              className="w-20"
                              value={item.quantity || ""}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  Number(e.target.value)
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="Weight"
                              className="w-24"
                              value={item.weight || ""}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "weight",
                                  Number(e.target.value)
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="Rate"
                              className="w-24"
                              value={item.rate || ""}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "rate",
                                  Number(e.target.value)
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              readOnly
                              className="w-24"
                              value={item.amount || ""}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {items.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-muted-foreground py-6"
                          >
                            No items added. Click "Add Item" to start adding
                            products.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Summary Section */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Subtotal</span>
                  <span className="flex items-center">
                    <IndianRupee className="h-3 w-3 mr-1" />
                    {calculateTotals().subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">GST (18%)</span>
                  <span className="flex items-center">
                    <IndianRupee className="h-3 w-3 mr-1" />
                    {calculateTotals().gst.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total</span>
                  <span className="flex items-center">
                    <IndianRupee className="h-3 w-3 mr-1" />
                    {calculateTotals().total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Payment Terms
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="15days">15 Days</SelectItem>
                      <SelectItem value="30days">30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Notes
                  </label>
                  <Input placeholder="Add notes or special instructions" />
                </div>
              </div>

              {selectedCustomer && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Current Balance: ₹
                    {sampleCustomers
                      .find((c) => c.id.toString() === selectedCustomer)
                      ?.currentBalance.toLocaleString()}
                    <br />
                    Available Credit: ₹
                    {(
                      sampleCustomers.find(
                        (c) => c.id.toString() === selectedCustomer
                      )?.creditLimit ||
                      0 -
                        sampleCustomers.find(
                          (c) => c.id.toString() === selectedCustomer
                        )?.currentBalance ||
                      0
                    ).toLocaleString()}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button>Create Sale</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sales List Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold">
                Sales Orders
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage your sales orders
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
                    Order No
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                    Items
                  </th>
                  <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Payment
                  </th>
                  <th className="h-12 px-4 text-center align-middle text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle">{sale.date}</td>
                    <td className="p-4 align-middle font-medium">{sale.id}</td>
                    <td className="p-4 align-middle">{sale.customerName}</td>
                    <td className="p-4 align-middle text-right">
                      {sale.items.length}
                    </td>
                    <td className="p-4 align-middle text-right">
                      ₹
                      {sale.total.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-4 align-middle">
                      <StatusBadge status={sale.status} />
                    </td>
                    <td className="p-4 align-middle">
                      <PaymentBadge status={sale.paymentStatus} />
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex justify-center gap-2">
                        <Button variant="ghost" size="icon">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
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

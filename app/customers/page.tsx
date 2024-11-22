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
  Download,
  Plus,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  FileText,
  IndianRupee,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Customer {
  id: string;
  name: string;
  type: "retail" | "wholesale" | "distributor";
  gstin?: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  currentBalance: number;
  status: "active" | "inactive";
  paymentTerms: string;
  lastPurchase?: string;
  totalPurchases: number;
  createdAt: string;
}

export default function CustomersPage() {
  const [open, setOpen] = useState(false);

  // Sample customers data
  const customers: Customer[] = [
    {
      id: "C001",
      name: "Global Traders",
      type: "wholesale",
      gstin: "09AAACH7409R1ZZ",
      contactPerson: "Rahul Kumar",
      phone: "+91 9876543210",
      email: "rahul@globaltraders.com",
      address: "123, Industrial Area, Phase 1, New Delhi - 110020",
      creditLimit: 500000,
      currentBalance: 125000,
      status: "active",
      paymentTerms: "Net 30",
      lastPurchase: "2024-03-15",
      totalPurchases: 1250000,
      createdAt: "2023-01-15",
    },
    {
      id: "C002",
      name: "City Hardware",
      type: "retail",
      gstin: "07BBBCH8809R1ZZ",
      contactPerson: "Amit Shah",
      phone: "+91 9876543211",
      email: "amit@cityhardware.com",
      address: "456, Market Road, Mumbai - 400001",
      creditLimit: 200000,
      currentBalance: 75000,
      status: "active",
      paymentTerms: "Net 15",
      lastPurchase: "2024-03-18",
      totalPurchases: 850000,
      createdAt: "2023-03-20",
    },
  ];

  const StatusBadge = ({ status }: { status: Customer["status"] }) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const TypeBadge = ({ type }: { type: Customer["type"] }) => {
    const styles = {
      retail: "bg-blue-100 text-blue-800",
      wholesale: "bg-purple-100 text-purple-800",
      distributor: "bg-orange-100 text-orange-800",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[type]}`}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your customers and their accounts
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Enter customer details and business information
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Basic Information */}
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Business/Customer Name*
                  </label>
                  <Input placeholder="Enter business name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Customer Type*
                    </label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="wholesale">Wholesale</SelectItem>
                        <SelectItem value="distributor">Distributor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      GSTIN
                    </label>
                    <Input placeholder="Enter GSTIN (if applicable)" />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Contact Person*
                    </label>
                    <Input placeholder="Enter contact person name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Phone Number*
                    </label>
                    <Input placeholder="Enter phone number" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Email Address
                  </label>
                  <Input type="email" placeholder="Enter email address" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Business Address*
                  </label>
                  <Input placeholder="Enter complete address" />
                </div>
              </div>

              {/* Financial Information */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Credit Limit
                    </label>
                    <Input type="number" placeholder="Enter credit limit" />
                  </div>
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
                        <SelectItem value="net15">Net 15</SelectItem>
                        <SelectItem value="net30">Net 30</SelectItem>
                        <SelectItem value="net45">Net 45</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Opening Balance
                  </label>
                  <Input type="number" placeholder="Enter opening balance" />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Set appropriate credit limits based on customer type and
                  payment history.
                </AlertDescription>
              </Alert>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button>Add Customer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Customers List Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold">
                Customer List
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage your customer information
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    ID
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Contact
                  </th>
                  <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                    Credit Limit
                  </th>
                  <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                    Balance
                  </th>
                  <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                    Total Sales
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-12 px-4 text-center align-middle text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle font-medium">
                      {customer.id}
                    </td>
                    <td className="p-4 align-middle">
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.contactPerson}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <TypeBadge type={customer.type} />
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-sm">
                        <div>{customer.phone}</div>
                        <div className="text-muted-foreground">
                          {customer.email}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-right">
                      ₹{customer.creditLimit.toLocaleString()}
                    </td>
                    <td className="p-4 align-middle text-right">
                      ₹{customer.currentBalance.toLocaleString()}
                    </td>
                    <td className="p-4 align-middle text-right">
                      ₹{customer.totalPurchases.toLocaleString()}
                    </td>
                    <td className="p-4 align-middle">
                      <StatusBadge status={customer.status} />
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

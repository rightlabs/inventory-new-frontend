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
  Building2,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Vendor {
  id: string;
  name: string;
  gstin: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  currentBalance: number;
  status: "active" | "inactive";
  paymentTerms: string;
}

export default function VendorsPage() {
  const [open, setOpen] = useState(false);

  // Sample vendors data
  const vendors: Vendor[] = [
    {
      id: "V001",
      name: "Ashutosh Ji",
      gstin: "09AAACH7409R1ZZ",
      contactPerson: "Ashutosh Kumar",
      phone: "+91 9876543210",
      email: "ashutosh@example.com",
      address: "123, Street Name, City, State - 123456",
      creditLimit: 500000,
      currentBalance: 125000,
      status: "active",
      paymentTerms: "Net 30",
    },
    {
      id: "V002",
      name: "Vendor 2",
      gstin: "07BBBCH8809R1ZZ",
      contactPerson: "John Doe",
      phone: "+91 9876543211",
      email: "john@example.com",
      address: "456, Street Name, City, State - 123456",
      creditLimit: 300000,
      currentBalance: 75000,
      status: "active",
      paymentTerms: "Net 15",
    },
  ];

  const StatusBadge = ({ status }: { status: Vendor["status"] }) => {
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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your vendors and supplier relationships
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="mr-2 h-4 w-4" /> Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
              <DialogDescription>
                Enter vendor details and business information
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Basic Information */}
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Business Name*
                  </label>
                  <Input placeholder="Enter business name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      GSTIN*
                    </label>
                    <Input placeholder="Enter GSTIN" />
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
                      Opening Balance
                    </label>
                    <Input type="number" placeholder="Enter opening balance" />
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Make sure to verify the GSTIN number before adding the vendor.
                </AlertDescription>
              </Alert>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button>Add Vendor</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vendors List Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold">
                Vendor List
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage your vendor information
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
                    ID
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Business Name
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Contact Person
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Phone
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    GSTIN
                  </th>
                  <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                    Credit Limit
                  </th>
                  <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                    Balance
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle font-medium">
                      {vendor.id}
                    </td>
                    <td className="p-4 align-middle">{vendor.name}</td>
                    <td className="p-4 align-middle">{vendor.contactPerson}</td>
                    <td className="p-4 align-middle">{vendor.phone}</td>
                    <td className="p-4 align-middle">{vendor.gstin}</td>
                    <td className="p-4 align-middle text-right">
                      ₹{vendor.creditLimit.toLocaleString()}
                    </td>
                    <td className="p-4 align-middle text-right">
                      ₹{vendor.currentBalance.toLocaleString()}
                    </td>
                    <td className="p-4 align-middle">
                      <StatusBadge status={vendor.status} />
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

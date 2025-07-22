"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Plus, ScrollText } from "lucide-react";
import { getVendors } from "@/api/vendor";
import VendorForm from "@/components/Forms/VendorForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getVendorLedger } from "@/api/transaction";
import { LedgerModal, TransactionData } from "@/components/Forms/LedgerModal";
interface Vendor {
  _id: string;
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
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [showLedger, setShowLedger] = useState(false);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  const fetchVendors = async () => {
    try {
      const response = await getVendors();

      if (response?.data?.statusCode === 200) {
        // Transform the data to match our interface
        const transformedVendors = response.data.data.map((vendor: any) => ({
          _id: vendor._id,
          id: vendor.id,
          name: vendor.name,
          gstin: vendor.gstin,
          contactPerson: vendor.contactPerson,
          phone: vendor.phone,
          email: vendor.email,
          address: vendor.address,
          creditLimit: vendor.creditLimit,
          currentBalance: vendor.currentBalance,
          status: vendor.status,
        }));

        setVendors(transformedVendors);
      }
    } catch (error) {
      toast.error("Failed to fetch vendors");
      console.error("Error fetching vendors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewLedger = async (vendorId: string) => {
    try {
      setSelectedVendor(vendorId);
      const response = await getVendorLedger(vendorId);
      if (response?.data.success) {
        setTransactions(response.data.data);
        setShowLedger(true);
      }
    } catch (error) {
      toast.error("Failed to fetch ledger");
    }
  };

  const handleDateSelect = async (date: Date) => {
    if (selectedVendor) {
      try {
        const response = await getVendorLedger(selectedVendor, {
          startDate: date.toISOString(),
          endDate: date.toISOString(),
        });
        if (response?.data.success) {
          setTransactions(response.data.data);
        }
      } catch (error) {
        toast.error("Failed to fetch transactions for selected date");
      }
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="space-y-8">
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
            <VendorForm
              onSuccess={() => {
                setOpen(false);
                fetchVendors();
              }}
              onCancel={() => setOpen(false)}
            />
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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p>Loading vendors...</p>
            </div>
          ) : vendors.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No vendors found</p>
            </div>
          ) : (
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
                    <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                      Ledger
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
                      <td className="p-4 align-middle">
                        {vendor.contactPerson || "-"}
                      </td>
                      <td className="p-4 align-middle">{vendor.phone || "-"}</td>
                      <td className="p-4 align-middle">{vendor.gstin || "-"}</td>
                      <td className="p-4 align-middle text-right">
                        {vendor.creditLimit ? `₹${vendor.creditLimit.toLocaleString()}` : "-"}
                      </td>
                      <td className="p-4 align-middle text-right">
                        {formatCurrency(vendor?.currentBalance)}
                      </td>
                      <td className="p-4 align-middle">
                        <StatusBadge status={vendor.status} />
                      </td>
                      <td className="p-4 align-middle">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewLedger(vendor?._id)}
                        >
                          <ScrollText className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {showLedger && (
        <LedgerModal
          transactions={transactions}
          open={showLedger}
          onClose={() => setShowLedger(false)}
          onDateSelect={handleDateSelect}
        />
      )}
    </div>
  );
}

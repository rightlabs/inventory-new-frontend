"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
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
import { Download, Plus, FileText } from "lucide-react";
import { getCustomers, Customer } from "@/api/customer";
import CustomerForm from "@/components/Forms/CustomerForm";
import { LedgerModal } from "@/components/Forms/LedgerModal";
import { getCustomerLedger } from "@/api/customer";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [transactions, setTransactions] = useState([]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await getCustomers();
      if (response?.data?.statusCode === 200) {
        setCustomers(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewLedger = async (customerId: string) => {
    try {
      setSelectedCustomerId(customerId);
      const response = await getCustomerLedger(customerId);
      if (response?.data.success) {
        setTransactions(response.data.data);
        setShowLedger(true);
      }
    } catch (error) {
      toast.error("Failed to fetch ledger");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

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
        {type?.charAt(0).toUpperCase() + type?.slice(1)}
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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Enter customer details and business information
              </DialogDescription>
            </DialogHeader>
            <CustomerForm
              onSuccess={() => {
                setOpen(false);
                fetchCustomers();
              }}
              onCancel={() => setOpen(false)}
            />
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
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading customers...</div>
          ) : (
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
                        {formatCurrency(customer.creditLimit)}
                      </td>
                      <td className="p-4 align-middle text-right">
                        {formatCurrency(customer.currentBalance)}
                      </td>
                      <td className="p-4 align-middle text-right">
                        {formatCurrency(customer.totalSales)}
                      </td>
                      <td className="p-4 align-middle">
                        <StatusBadge status={customer.status} />
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewLedger(customer._id)}
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showLedger && selectedCustomerId && (
        <LedgerModal
          transactions={transactions}
          open={showLedger}
          onClose={() => setShowLedger(false)}
        />
      )}
    </div>
  );
}

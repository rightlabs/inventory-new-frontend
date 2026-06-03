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
import { Download, Plus, FileText, Pencil, Wallet, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  getCustomers,
  getCustomerById,
  getCustomerLedger,
} from "@/api/customer";
import { Customer, CustomerDetail } from "@/types/type";
import CustomerForm from "@/components/Forms/CustomerForm";
import AdvancePaymentModal from "@/components/Forms/AdvancePaymentModal";
import { LedgerModal } from "@/components/Forms/LedgerModal";
import DataPagination from "@/components/DataPagination";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [transactions, setTransactions] = useState([]);

  // Edit customer state
  const [editOpen, setEditOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] =
    useState<CustomerDetail | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  // Record payment state
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advanceCustomer, setAdvanceCustomer] = useState<{
    _id: string;
    name: string;
    currentBalance: number;
  } | null>(null);

  const fetchCustomers = async (page = 1, search = debouncedSearch) => {
    try {
      setIsLoading(true);
      const customersResponse = await getCustomers({ page, limit: 10, search });

      if (customersResponse?.data?.statusCode === 200) {
        const data = customersResponse.data.data;
        setCustomers(data.customers || []);
        setPagination(
          data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 }
        );
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

  const handleEditCustomer = async (customerId: string) => {
    try {
      setIsLoadingEdit(true);
      const response = await getCustomerById(customerId);
      if (response?.data?.statusCode === 200) {
        setEditCustomerData(response.data.data);
        setEditOpen(true);
      }
    } catch (error) {
      toast.error("Failed to fetch customer details");
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const handleRecordPayment = (customerId: string, customerName: string, currentBalance: number) => {
    setAdvanceCustomer({ _id: customerId, name: customerName, currentBalance });
    setAdvanceOpen(true);
  };

  // Debounce the search box, then reload from page 1.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    fetchCustomers(1, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Math.abs(amount || 0) < 0.005 ? 0 : amount);
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
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, contact person, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading customers...</div>
          ) : (
            <>
            <div className="rounded-md border overflow-auto max-h-[calc(100vh-260px)]">
              <table className="w-full">
                <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-muted">
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                      ID
                    </th>
                    <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                      Customer
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
                  {customers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-4 text-center text-muted-foreground"
                      >
                        No customers found
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
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
                            {customer.contactPerson || "-"}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 align-middle">
                        <div className="text-sm">
                          <div>{customer.phone || "-"}</div>
                          <div className="text-muted-foreground">
                            {customer.email || "-"}
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
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="group"
                            title="Edit Customer"
                            disabled={isLoadingEdit}
                            onClick={() => handleEditCustomer(customer._id)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="group"
                            title="Record Payment"
                            onClick={() =>
                              handleRecordPayment(customer._id, customer.name, customer.currentBalance)
                            }
                          >
                            <Wallet className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="group"
                            title="View Ledger"
                            onClick={() => handleViewLedger(customer._id)}
                          >
                            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing page {pagination.currentPage} of{" "}
                  {pagination.totalPages} ({pagination.totalItems} customers)
                </p>
                <DataPagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(p) => fetchCustomers(p)}
                />
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditCustomerData(null);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer details and business information
            </DialogDescription>
          </DialogHeader>
          {editCustomerData && (
            <CustomerForm
              initialData={editCustomerData}
              onSuccess={() => {
                setEditOpen(false);
                setEditCustomerData(null);
                fetchCustomers(pagination.currentPage);
              }}
              onCancel={() => {
                setEditOpen(false);
                setEditCustomerData(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog
        open={advanceOpen}
        onOpenChange={(open) => {
          setAdvanceOpen(open);
          if (!open) setAdvanceCustomer(null);
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment received from the customer
            </DialogDescription>
          </DialogHeader>
          {advanceCustomer && (
            <AdvancePaymentModal
              customerId={advanceCustomer._id}
              customerName={advanceCustomer.name}
              currentBalance={advanceCustomer.currentBalance}
              onSuccess={() => {
                setAdvanceOpen(false);
                setAdvanceCustomer(null);
                fetchCustomers(pagination.currentPage);
              }}
              onCancel={() => {
                setAdvanceOpen(false);
                setAdvanceCustomer(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {showLedger && selectedCustomerId && (
        <LedgerModal
          transactions={transactions}
          open={showLedger}
          onClose={() => setShowLedger(false)}
          entityType="customer"
          entityId={selectedCustomerId}
          entityName={
            customers.find((c) => c._id === selectedCustomerId)?.name
          }
        />
      )}
    </div>
  );
}

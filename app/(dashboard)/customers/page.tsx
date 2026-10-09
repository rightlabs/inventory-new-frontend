"use client";

import { useEffect, useRef, useState } from "react";
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
import { Download, Plus, FileText, Pencil, Wallet, Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  getCustomers,
  getCustomerById,
  getCustomerLedger,
} from "@/api/customer";
import { Customer, CustomerDetail } from "@/types/type";
import CustomerForm from "@/components/Forms/CustomerForm";
import RecordPaymentModal from "@/components/Forms/RecordPaymentModal";
import ReturnInventoryModal from "@/components/Forms/ReturnInventoryModal";
import BalanceAmount from "@/components/BalanceAmount";
import { LedgerModal } from "@/components/Forms/LedgerModal";
import DataPagination from "@/components/DataPagination";
import { formatINR } from "@/utils/format";
import ListStatusRow from "@/components/ListStatusRow";
import { PartyName } from "@/components/ModalParts";

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

  // "Return goods" (no bill) for one customer
  const [returnCustomerId, setReturnCustomerId] = useState<string | null>(null);

  // Record payment state
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advanceCustomer, setAdvanceCustomer] = useState<{
    _id: string;
    name: string;
    currentBalance: number;
    code?: string;
  } | null>(null);

  const latestRequest = useRef(0); // ignore out-of-order responses
  const lastQuery = useRef({ page: 1, search: "" }); // for Retry
  const [loadError, setLoadError] = useState(false);

  const fetchCustomers = async (page = 1, search = debouncedSearch) => {
    const requestId = ++latestRequest.current;
    lastQuery.current = { page, search };
    try {
      setIsLoading(true);
      setLoadError(false);
      const customersResponse = await getCustomers({ page, limit: 10, search });
      if (requestId !== latestRequest.current) return;
      if (customersResponse?.data?.statusCode !== 200) throw new Error("bad response");
      // Rows and page footer always come from the same response.
      const data = customersResponse.data.data;
      setCustomers(data.customers || []);
      setPagination(
        data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 }
      );
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      setCustomers([]);
      setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });
      setLoadError(true);
      toast.error("Failed to fetch customers");
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
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

  const handleRecordPayment = (customerId: string, customerName: string, currentBalance: number, code?: string) => {
    setAdvanceCustomer({ _id: customerId, name: customerName, currentBalance, code });
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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
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
          <div className="flex flex-wrap justify-between items-start gap-3">
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
          {(
            <>
            <div className="rounded-md border overflow-auto max-h-[calc(100vh-260px)]">
              <table className="w-full sticky-actions">
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
                  {isLoading ? (
                    <ListStatusRow status="loading" colSpan={8} search={debouncedSearch} />
                  ) : loadError ? (
                    <ListStatusRow
                      status="error"
                      colSpan={8}
                      onRetry={() => fetchCustomers(lastQuery.current.page, lastQuery.current.search)}
                    />
                  ) : customers.length === 0 ? (
                    <ListStatusRow
                      status="empty"
                      colSpan={8}
                      search={debouncedSearch}
                      emptyText="No customers found"
                    />
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
                        {formatINR(customer.creditLimit)}
                      </td>
                      <td className="p-4 align-middle text-right whitespace-nowrap">
                        <BalanceAmount value={customer.currentBalance} />
                      </td>
                      <td className="p-4 align-middle text-right">
                        {formatINR(customer.totalSales)}
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
                              handleRecordPayment(customer._id, customer.name, customer.currentBalance, customer.id)
                            }
                          >
                            <Wallet className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="group"
                            title="Return goods"
                            aria-label={`Return goods from ${customer.name}`}
                            onClick={() => setReturnCustomerId(customer._id)}
                          >
                            <RotateCcw className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
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
            {!isLoading && !loadError && pagination.totalPages > 1 && (
              <div className="flex flex-wrap justify-between items-center gap-2 mt-4">
                <p className="text-sm text-muted-foreground" data-testid="list-footer">
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
            {editCustomerData && (
              <PartyName
                name={editCustomerData.businessName}
                code={editCustomerData.id}
                className="pt-1 text-sm"
              />
            )}
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

      {/* Return goods without a bill, credited to this customer */}
      <ReturnInventoryModal
        open={!!returnCustomerId}
        initialCustomerId={returnCustomerId || undefined}
        onOpenChange={(open) => {
          if (!open) setReturnCustomerId(null);
        }}
        onSuccess={() => {
          setReturnCustomerId(null);
          fetchCustomers(pagination.currentPage);
        }}
      />

      {/* Record Payment Dialog */}
      <RecordPaymentModal
        entityType="customer"
        target={advanceCustomer}
        open={advanceOpen}
        onOpenChange={(open) => {
          setAdvanceOpen(open);
          if (!open) setAdvanceCustomer(null);
        }}
        onSuccess={() => {
          setAdvanceOpen(false);
          setAdvanceCustomer(null);
          fetchCustomers(pagination.currentPage);
        }}
      />

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
          entityCode={customers.find((c) => c._id === selectedCustomerId)?.id}
          entityPhone={customers.find((c) => c._id === selectedCustomerId)?.phone}
        />
      )}
    </div>
  );
}

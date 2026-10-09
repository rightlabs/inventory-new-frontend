"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Download, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getVendors } from "@/api/vendor";
import { getPurchases } from "@/api/purchase";
import toast from "react-hot-toast";
import PurchaseModal from "@/components/Forms/PurchaseForm";
import { format } from "date-fns";
import PaymentModal from "@/components/Forms/PaymentModal";
import DataPagination from "@/components/DataPagination";
import { formatINR } from "@/utils/format";
import ListStatusRow from "@/components/ListStatusRow";

interface Vendor {
  id: string;
  name: string;
  gstin: string;
  _id: string;
  phone?: string;
  contactPerson?: string;
}

interface Purchase {
  _id: string;
  purchaseNumber: string;
  date: string;
  invoiceNo: string;
  vendor: {
    _id: string;
    name: string;
    gstin: string;
  };
  totalAmount: number;
  discount: number;
  grandTotal: number;
  freight?: number;
  freightPaidBy?: "shop" | "vendor";
  freightPayment?: { mode?: string; transporter?: string };
  balanceAmount: number;
  status: "pending" | "received";
  paymentStatus: "unpaid" | "partial" | "paid";
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export default function PurchasePage() {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const latestRequest = useRef(0); // ignore out-of-order responses
  const [loadError, setLoadError] = useState(false);
  const lastQuery = useRef({ page: 1, search: "" }); // for Retry
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const fetchVendors = async () => {
    try {
      const response = await getVendors();

      if (response?.data?.statusCode === 200) {
        const transformedVendors = response.data.data.map((vendor: any) => ({
          _id: vendor._id,
          id: vendor.id,
          name: vendor.name,
          gstin: vendor.gstin,
          phone: vendor.phone,
          contactPerson: vendor.contactPerson,
        }));

        setVendors(transformedVendors);
      }
    } catch (error) {
      toast.error("Failed to fetch vendors");
      console.error("Error fetching vendors:", error);
    }
  };

  // Search runs on the server across ALL purchases, then paginates.
  const fetchPurchases = async (page = 1, search = debouncedSearch) => {
    const requestId = ++latestRequest.current;
    lastQuery.current = { page, search };
    try {
      setIsLoading(true);
      setLoadError(false);
      const response = await getPurchases({ page, limit: 10, search });
      if (requestId !== latestRequest.current) return;
      if (response?.data?.statusCode !== 200) throw new Error("bad response");
      // Rows and page footer always come from the same response.
      setPurchases(response.data.data.purchases);
      setPagination(response.data.data.pagination);
    } catch (error) {
      if (requestId !== latestRequest.current) return;
      setPurchases([]);
      setPagination((p) => ({ ...p, currentPage: 1, totalPages: 1, totalItems: 0 }));
      setLoadError(true);
      toast.error("Failed to fetch purchases");
      console.error("Error fetching purchases:", error);
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Debounce the search box, then reload from page 1 (also the first load).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    fetchPurchases(1, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

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
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your purchase orders and transactions
          </p>
        </div>
        <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="mr-2 h-4 w-4" /> Add Purchase
            </Button>
          </DialogTrigger>
          <PurchaseModal
            open={purchaseOpen}
            onOpenChange={setPurchaseOpen}
            vendors={vendors}
            isLoading={isLoading}
            onSuccess={() => fetchPurchases(pagination.currentPage)}
            fetchVendors={fetchVendors}
          />
        </Dialog>
        {selectedPurchase && (
          <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
            <PaymentModal
              open={paymentModalOpen}
              onOpenChange={setPaymentModalOpen}
              purchase={selectedPurchase}
              onSuccess={() => {
                fetchPurchases();
                setSelectedPurchase(null);
              }}
            />
          </Dialog>
        )}
      </div>

      {/* Purchase Orders Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap justify-between items-start gap-3">
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
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search all purchases by PO no., invoice no. or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto max-h-[calc(100vh-260px)]">
            <table className="w-full sticky-actions tight-cells">
              <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-muted">
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
                    Balance
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Payment
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
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
                    onRetry={() => fetchPurchases(lastQuery.current.page, lastQuery.current.search)}
                  />
                ) : purchases.length === 0 ? (
                  <ListStatusRow
                    status="empty"
                    colSpan={8}
                    search={debouncedSearch}
                    emptyText="No purchases found"
                  />
                ) : (
                  purchases.map((purchase) => (
                    <tr
                      key={purchase._id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 align-middle">
                        {format(new Date(purchase.date), "dd/MM/yyyy")}
                      </td>
                      <td className="p-4 align-middle font-medium">
                        {purchase.purchaseNumber}
                      </td>
                      <td className="p-4 align-middle">
                        {purchase?.invoiceNo || "-"}
                      </td>
                      <td className="p-4 align-middle">
                        {purchase.vendor.name}
                      </td>
                      <td className="p-4 align-middle text-right">
                        {formatINR(purchase.grandTotal)}
                        {Number(purchase.freight) > 0 && (
                          <div className="text-xs text-muted-foreground whitespace-nowrap" data-testid="purchase-freight-note">
                            {purchase.freightPaidBy === "shop"
                              ? `Freight ${formatINR(purchase.freight || 0)} paid to ${purchase.freightPayment?.transporter || "transporter"}`
                              : `incl. freight ${formatINR(purchase.freight || 0)} (vendor bill)`}
                          </div>
                        )}
                      </td>
                      <td className="p-4 align-middle text-right">
                        {formatINR(purchase.balanceAmount)}
                      </td>
                      <td className="p-4 align-middle">
                        <PaymentBadge status={purchase.paymentStatus} />
                      </td>
                      <td className="p-4 align-middle">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPurchase(purchase);
                            setPaymentModalOpen(true);
                          }}
                          disabled={purchase.paymentStatus === "paid"}
                        >
                          Add Payment
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && !loadError && pagination.totalPages > 1 && (
            <div className="flex flex-wrap justify-between items-center gap-2 mt-4">
              <p className="text-sm text-muted-foreground" data-testid="list-footer">
                Showing page {pagination.currentPage} of {pagination.totalPages} (
                {pagination.totalItems} purchases)
              </p>
              <DataPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(p) => fetchPurchases(p)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

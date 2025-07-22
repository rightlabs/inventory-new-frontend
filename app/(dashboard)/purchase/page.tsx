"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Download, Plus } from "lucide-react";
import { getVendors } from "@/api/vendor";
import { getPurchases } from "@/api/purchase";
import toast from "react-hot-toast";
import PurchaseModal from "@/components/Forms/PurchaseForm";
import { format } from "date-fns";
import PaymentModal from "@/components/Forms/PaymentModal";

interface Vendor {
  id: string;
  name: string;
  gstin: string;
  _id: string;
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
  gstAmount: number;
  grandTotal: number;
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
        }));

        setVendors(transformedVendors);
      }
    } catch (error) {
      toast.error("Failed to fetch vendors");
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchPurchases = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await getPurchases({ page, limit: 10 });

      if (response?.data?.statusCode === 200) {
        setPurchases(response.data.data.purchases);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      toast.error("Failed to fetch purchases");
      console.error("Error fetching purchases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchPurchases();
  }, []);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount);
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
                    Balance
                  </th>
                  <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                    Status
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
                  <tr>
                    <td colSpan={8} className="p-4 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center">
                      No purchases found
                    </td>
                  </tr>
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
                        {formatCurrency(purchase.grandTotal)}
                      </td>
                      <td className="p-4 align-middle text-right">
                        {formatCurrency(purchase.balanceAmount)}
                      </td>
                      <td className="p-4 align-middle">
                        <StatusBadge status={purchase.status} />
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
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                Showing page {pagination.currentPage} of {pagination.totalPages}
              </p>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage === 1}
                  onClick={() => fetchPurchases(pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => fetchPurchases(pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

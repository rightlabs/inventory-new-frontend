"use client";

import { useEffect, useState } from "react";
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
import toast from "react-hot-toast";
import { getCustomers, Customer } from "@/api/customer";
import { downloadSaleInvoice, getSales, Sale } from "@/api/sale";
import { getItems } from "@/api/items";
import SaleForm from "@/components/Forms/SaleForm";
import { PaymentModal } from "@/components/Forms/PaymentModal";

export default function SalesPage() {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchCustomers = async () => {
    try {
      const response = await getCustomers();
      if (response?.data?.statusCode === 200) {
        setCustomers(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch customers");
    }
  };

  const fetchSales = async () => {
    try {
      setIsLoading(true);
      const response = await getSales();
      if (response?.data?.statusCode === 200) {
        setSales(response.data.data.sales);
      }
    } catch (error) {
      toast.error("Failed to fetch sales");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await getItems();
      if (response?.data?.statusCode === 200) {
        setItems(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch items");
    }
  };

  useEffect(() => {
    Promise.all([fetchCustomers(), fetchSales(), fetchItems()]);
  }, []);

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

  // In your SalesPage component

  const downloadInvoice = async (sale: Sale) => {
    try {
      const response = await downloadSaleInvoice(sale._id);

      // Create a blob from the PDF Stream
      const blob = new Blob([response.data], { type: "application/pdf" });

      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${sale.saleNumber}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
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
          <SaleForm
            open={open}
            onOpenChange={setOpen}
            customers={customers}
            isLoading={isLoading}
            onSuccess={fetchSales}
            fetchCustomers={fetchCustomers}
            items={items}
          />
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
          {isLoading ? (
            <div className="text-center py-4">Loading sales...</div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                      Sale No
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
                    <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                      Balance
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
                      key={sale._id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 align-middle">
                        {new Date(sale.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 align-middle font-medium">
                        {sale.saleNumber}
                      </td>
                      <td className="p-4 align-middle">
                        <div>
                          <div className="font-medium">
                            {sale.customer.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {sale.customer.gstin}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-right">
                        {sale.itemCount}
                      </td>
                      <td className="p-4 align-middle text-right">
                        ₹{sale.grandTotal.toLocaleString()}
                      </td>
                      <td className="p-4 align-middle text-right">
                        ₹{sale.balanceAmount.toLocaleString()}
                      </td>
                      <td className="p-4 align-middle">
                        <StatusBadge status={sale.status} />
                      </td>
                      <td className="p-4 align-middle">
                        <PaymentBadge status={sale.paymentStatus} />
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex justify-center gap-2">
                          {/* Payment Button */}
                          {/* <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedSale(sale);
                              setShowPaymentModal(true);
                            }}
                            disabled={sale.paymentStatus === "paid"}
                            title="Add Payment"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </Button> */}

                          {/* Download Invoice Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              // Add your download invoice logic here
                              // You'll need to implement this function
                              downloadInvoice(sale);
                            }}
                            title="Download Invoice"
                          >
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-4 text-center text-muted-foreground"
                      >
                        No sales found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {selectedSale && (
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <PaymentModal
            open={showPaymentModal}
            onOpenChange={setShowPaymentModal}
            sale={selectedSale}
            onSuccess={() => {
              fetchSales();
              setSelectedSale(null);
            }}
          />
        </Dialog>
      )}
    </div>
  );
}

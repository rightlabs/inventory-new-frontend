import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { downloadLedgerStatement } from "@/api/transaction";

export interface TransactionData {
  _id: string;
  date: string;
  documentNumber: string;
  type: "debit" | "credit";
  mode: "cash" | "cheque" | "online" | "purchase" | "sale" | "advance" | "return";
  amount: number;
  reference?: string;
  notes?: string;
  balance: number;
}

interface LedgerModalProps {
  transactions: TransactionData[];
  onClose: () => void;
  open: boolean;
  onDateSelect?: (date: Date) => void;
  entityType?: "customer" | "vendor";
  entityId?: string | null;
  entityName?: string;
}

export function LedgerModal({
  transactions,
  onClose,
  open,
  entityType,
  entityId,
  entityName,
}: LedgerModalProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!entityType || !entityId) return;
    try {
      setDownloading(true);
      const response = await downloadLedgerStatement(entityType, entityId);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const fileName = `Ledger-${(entityName || entityId).replace(
        /[^a-z0-9]/gi,
        "_"
      )}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Ledger downloaded");
    } catch (error) {
      console.error("Error downloading ledger:", error);
      toast.error("Failed to download ledger");
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Math.abs(amount || 0) < 0.005 ? 0 : amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-6">
            <DialogTitle>Transaction History</DialogTitle>
            {entityType && entityId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading ? "Preparing..." : "Download Ledger"}
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-muted">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.documentNumber}</TableCell>
                  <TableCell>
                    <span
                      className={`${
                        transaction.type === "debit"
                          ? "text-red-600"
                          : "text-green-600"
                      } capitalize`}
                    >
                      {transaction.type}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">
                    {transaction.mode}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(transaction.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

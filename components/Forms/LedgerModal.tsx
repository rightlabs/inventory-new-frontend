import React from "react";
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

export interface TransactionData {
  _id: string;
  date: string;
  documentNumber: string;
  type: "debit" | "credit";
  mode: "cash" | "cheque" | "online" | "purchase" | "sale";
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
}

export function LedgerModal({ transactions, onClose, open }: LedgerModalProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Transaction History</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader>
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

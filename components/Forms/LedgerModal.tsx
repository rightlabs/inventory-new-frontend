import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Phone, ScrollText } from "lucide-react";
import toast from "react-hot-toast";
import { downloadLedgerStatement } from "@/api/transaction";
import BalanceAmount from "@/components/BalanceAmount";
import { DateCell, EmptyRow } from "@/components/mis/ui";
import { LedgerTag, PartyName, SignedINR, WrapCode, ledgerKind } from "@/components/ModalParts";
import { cn } from "@/lib/utils";

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
  /** C004 / V001 — shown as a code pill next to the name. */
  entityCode?: string;
  entityPhone?: string;
  /** Balance wording when entityType is not passed (no download button). */
  partyKind?: "customer" | "vendor";
}

export function LedgerModal({
  transactions,
  onClose,
  open,
  entityType,
  entityId,
  entityName,
  entityCode,
  entityPhone,
  partyKind,
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

  // Balance wording ("Customer owes" / "You owe") — entityType when the
  // modal can download, else partyKind (sale / purchase form).
  const who = entityType ?? partyKind;
  const last = transactions[transactions.length - 1];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl grid-cols-[minmax(0,1fr)]">
        <DialogHeader className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pr-6">
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
          {(entityName || entityCode || last) && (
            <div
              className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-left"
              data-testid="ledger-summary"
            >
              <div className="min-w-0 space-y-0.5">
                <PartyName name={entityName} code={entityCode} />
                {entityPhone && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 tabular-nums">
                    <Phone className="h-3 w-3" aria-hidden />
                    {entityPhone}
                  </div>
                )}
              </div>
              {last && (
                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-500">
                    Balance now · {transactions.length}{" "}
                    {transactions.length === 1 ? "entry" : "entries"}
                  </div>
                  <BalanceAmount
                    value={last.balance}
                    entity={who}
                    className="text-base font-semibold tabular-nums text-slate-900"
                  />
                </div>
              )}
            </div>
          )}
        </DialogHeader>
        {/* One scroller (both ways): a bare <table>, not <Table>, whose own
            overflow wrapper stopped the sticky header from sticking. */}
        <div className="max-h-[60vh] min-w-0 overflow-auto overscroll-contain rounded-md border" data-testid="ledger-scroll">
          <table className="w-full caption-bottom text-sm">
            <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-muted">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">
                  Amount
                  <span className="block whitespace-nowrap text-[11px] font-normal leading-3 text-slate-500">
                    + adds · − reduces
                  </span>
                </TableHead>
                <TableHead className="text-right !bg-slate-100">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 && (
                <EmptyRow
                  colSpan={6}
                  icon={ScrollText}
                  title="No transactions yet"
                  description="Bills, payments and returns for this account will show here."
                />
              )}
              {transactions.map((transaction) => {
                const kind = ledgerKind(transaction);
                const isOpening = kind === "opening";
                const debit = transaction.type === "debit";
                // Notes that only repeat the tag are not shown again.
                const note =
                  transaction.notes && transaction.notes !== "Opening Balance"
                    ? transaction.notes
                    : "";
                return (
                  <TableRow
                    key={transaction._id}
                    className={cn("align-top", isOpening && "bg-amber-50/50 hover:bg-amber-50")}
                    data-kind={kind}
                  >
                    <TableCell className="py-3">
                      <DateCell date={transaction.date} />
                    </TableCell>
                    <TableCell className="min-w-[180px] max-w-[300px] py-3">
                      {isOpening ? (
                        <div className="text-sm font-medium text-slate-800">Opening balance</div>
                      ) : (
                        <WrapCode code={transaction.documentNumber} />
                      )}
                      {(note || transaction.reference) && (
                        <div className="mt-1 text-xs leading-4 text-slate-600 [overflow-wrap:anywhere]">
                          {note}
                          {transaction.reference ? (
                            <>
                              {note ? " · " : ""}Ref:{" "}
                              <span className="font-mono text-slate-700">{transaction.reference}</span>
                            </>
                          ) : null}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <LedgerTag kind={kind} />
                      <div
                        className={cn(
                          "mt-1 text-xs font-medium capitalize",
                          debit ? "text-red-600" : "text-green-600"
                        )}
                      >
                        {transaction.type}
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "py-3 capitalize",
                        ["cash", "cheque", "online"].includes(transaction.mode)
                          ? "text-slate-900"
                          : "text-slate-500"
                      )}
                    >
                      {transaction.mode}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <SignedINR
                        value={transaction.amount}
                        sign={debit ? "+" : "−"}
                        tone={debit ? "up" : "down"}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap bg-slate-50/80 py-3 text-right">
                      <BalanceAmount
                        value={transaction.balance}
                        className="font-semibold tabular-nums text-slate-900"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React from "react";

const SummaryPurchase: React.FC<{
  calculateFinalAmounts: any;
  processedData: {
    totalAmount: number;
  };
  formData: any;
  formatCurrency: (num: number) => string;
}> = ({ calculateFinalAmounts, processedData, formData, formatCurrency }) => {
  const calculations = calculateFinalAmounts();
  if (!calculations) return null;

  return (
    <div className="bg-slate-50/80 border border-slate-200 p-4 rounded-lg space-y-2 tabular-nums">
      <div className="flex justify-between">
        <span className="text-sm">Total Amount</span>
        <span>{formatCurrency(processedData.totalAmount)}</span>
      </div>
      {formData.discount > 0 && (
        <div className="flex justify-between">
          <span className="text-sm">Discount Amount</span>
          <span>{formatCurrency(calculations.discountAmount)}</span>
        </div>
      )}
      {formData.freight > 0 && (
        <div className="flex justify-between gap-2" data-testid="summary-freight">
          <span className="text-sm">
            {formData.freightPaidBy === "shop"
              ? "Freight (paid to transporter — not on vendor bill)"
              : "Freight (on vendor bill)"}
          </span>
          <span className={formData.freightPaidBy === "shop" ? "text-amber-700 whitespace-nowrap" : "whitespace-nowrap"}>
            {formData.freightPaidBy === "shop" ? "(" : ""}
            {formatCurrency(Number(formData.freight))}
            {formData.freightPaidBy === "shop" ? ")" : ""}
          </span>
        </div>
      )}
      {formData.tcs > 0 && (
        <div className="flex justify-between">
          <span className="text-sm">TCS Amount</span>
          <span>{formatCurrency(Number(formData.tcs))}</span>
        </div>
      )}
      <div className="flex justify-between items-baseline font-semibold pt-2 border-t border-slate-300 text-slate-900">
        <span>Grand Total</span>
        <span className="text-xl">{formatCurrency(calculations.grandTotal)}</span>
      </div>
      {formData.amountPaid > 0 && (
        <>
          <div className="flex justify-between text-green-600">
            <span>Amount Paid</span>
            <span>{formatCurrency(Number(formData.amountPaid))}</span>
          </div>
          <div className="flex justify-between text-red-600 font-medium">
            <span>Balance</span>
            <span>{formatCurrency(calculations.balance)}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default SummaryPurchase;

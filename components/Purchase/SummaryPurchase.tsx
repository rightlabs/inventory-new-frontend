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
    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
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
        <div className="flex justify-between">
          <span className="text-sm">Freight</span>
          <span>{formatCurrency(Number(formData.freight))}</span>
        </div>
      )}
      {formData.tcs > 0 && (
        <div className="flex justify-between">
          <span className="text-sm">TCS Amount</span>
          <span>{formatCurrency(Number(formData.tcs))}</span>
        </div>
      )}
      <div className="flex justify-between font-medium pt-2 border-t">
        <span>Grand Total</span>
        <span>{formatCurrency(calculations.grandTotal)}</span>
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

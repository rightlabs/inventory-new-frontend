export const formatINR = (amount: number, fractionDigits = 2) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;

export const formatIndianNumber = (n: number, fractionDigits = 2) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

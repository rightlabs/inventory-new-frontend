// Business rule: all money, rates and kg quantities are stored and displayed
// with at most 2 decimal places, formatted with Indian (lakh/crore) commas.

type Numeric = number | string | null | undefined;

// Round to 2 decimals, half away from zero (symmetric for negatives).
// Number.EPSILON nudges values like 1.005 (stored as 1.00499…) the right way.
export const round2 = (n: Numeric): number => {
  const v = Number(n) || 0;
  const r =
    Math.sign(v) * (Math.round((Math.abs(v) + Number.EPSILON) * 100) / 100);
  return r === 0 ? 0 : r; // avoid -0
};

// Treat tiny float drift as zero so it never renders as "-₹0.00".
const clean = (n: Numeric) => {
  const v = Number(n) || 0;
  return Math.abs(v) < 0.005 ? 0 : v;
};

// Money: ₹1,23,456.70 (exactly 2 decimals; negatives as -₹1,234.00).
export const formatINR = (amount: Numeric, fractionDigits = 2) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(clean(amount));

// Plain number with Indian commas and a fixed number of decimals (default 2).
export const formatIndianNumber = (n: Numeric, fractionDigits = 2) =>
  clean(n).toLocaleString("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

// Quantity: up to 2 decimals, trailing zeros dropped, optional unit —
// 86.85000000000001 -> "86.85 kg", 27 -> "27 pcs", 1234567.5 -> "12,34,567.5".
export const formatQty = (n: Numeric, unit?: string) => {
  const text = round2(n).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return unit ? `${text} ${unit}` : text;
};

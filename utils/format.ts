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

// ------------------------------------------------------------ account balance
// Customer/vendor running balance. Positive = owed (customer owes us / we owe
// the vendor). Negative = advance (customer paid ahead / we paid the vendor
// ahead) — shown as "₹X Adv" in green, never as "-₹X".
export type BalanceEntity = "customer" | "vendor";

export const isAdvanceBalance = (n: Numeric) => clean(n) < 0;

// Short form for tables/lists: "₹5,000.00" or "₹5,000.00 Adv".
export const formatBalance = (n: Numeric) => {
  const v = clean(n);
  return v < 0 ? `${formatINR(-v)} Adv` : formatINR(v);
};

// Long form with wording, e.g. "Customer owes ₹3,000.00",
// "Advance received ₹5,000.00", "You owe ₹1,200.00",
// "Advance with vendor ₹800.00". Zero → "No balance".
export const balanceLabel = (entity: BalanceEntity, n: Numeric) => {
  const v = clean(n);
  if (v === 0) return "No balance";
  if (entity === "customer") {
    return v > 0
      ? `Customer owes ${formatINR(v)}`
      : `Advance received ${formatINR(-v)}`;
  }
  return v > 0 ? `You owe ${formatINR(v)}` : `Advance with vendor ${formatINR(-v)}`;
};

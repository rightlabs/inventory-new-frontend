// Display-only money formatters for the MIS screens.
// They never change a number: they only decide how many digits to show.
// The shared formatINR in ./format stays the source for bills, ledgers, CSV.

import { round2 } from "./format";

type Numeric = number | string | null | undefined;

// Typographic minus: easier to see than "-" next to "₹" in big numbers.
export const MINUS = "−";

const clean = (n: Numeric) => {
  const v = round2(n);
  return Math.abs(v) < 0.005 ? 0 : v;
};

/**
 * ₹ with Indian commas. Whole rupees show no paise; paise show only when
 * they are not zero.
 *   82960      -> "₹82,960"
 *   84102.12   -> "₹84,102.12"
 *   84102.1    -> "₹84,102.10"
 *   -1142      -> "−₹1,142"
 *   signed: true, 500 -> "+₹500"
 */
export const formatINRSmart = (
  amount: Numeric,
  opts: { signed?: boolean } = {}
) => {
  const v = clean(amount);
  const abs = Math.abs(v);
  const hasPaise = Math.round(abs * 100) % 100 !== 0;
  const body =
    "₹" +
    abs.toLocaleString("en-IN", {
      minimumFractionDigits: hasPaise ? 2 : 0,
      maximumFractionDigits: hasPaise ? 2 : 0,
    });
  if (v < 0) return MINUS + body;
  if (opts.signed && v > 0) return "+" + body;
  return body;
};

/** Alias kept for readability at call sites ("compact" = no needless .00). */
export const formatMoneyCompact = formatINRSmart;

/**
 * Short form for chart axes and tight spaces, Indian units.
 *   950 -> "₹950", 45000 -> "₹45K", 350000 -> "₹3.5L",
 *   3500000 -> "₹35L", 12000000 -> "₹1.2Cr", -750000 -> "−₹7.5L"
 */
export const formatINRShort = (amount: Numeric) => {
  const v = clean(amount);
  const abs = Math.abs(v);
  const trim = (n: number, d: number) =>
    n.toFixed(d).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  let body: string;
  if (abs >= 1e7) body = trim(abs / 1e7, abs >= 1e9 ? 0 : 1) + "Cr";
  else if (abs >= 1e5) body = trim(abs / 1e5, abs >= 1e6 ? 0 : 1) + "L";
  else if (abs >= 1e3) body = trim(abs / 1e3, abs >= 1e4 ? 0 : 1) + "K";
  else body = String(Math.round(abs));
  return (v < 0 ? MINUS : "") + "₹" + body;
};

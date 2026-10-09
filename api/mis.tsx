import API_INSTANCE from "./index";

export interface MisKpis {
  totalRevenue: number;
  itemRevenue: number;
  /** COGS of the bills, before goods came back. */
  billsCogs: number;
  /** Value / cost of goods returned in the range (by return date). */
  returnsValue: number;
  returnsCost: number;
  returnsCount: number;
  customerReturnsCredit: number;
  /** itemRevenue − returnsValue */
  netRevenue: number;
  /** Net COGS (billsCogs − returnsCost). */
  totalCogs: number;
  totalPurchases: number;
  grossProfit: number;
  grossMargin: number;
  salesCount: number;
  purchaseCount: number;
  avgOrderValue: number;
  totalDiscount: number;
  totalAdditionalCharges: number;
}

export interface MisCategoryRow {
  category: string;
  /** Net of returns. */
  revenue: number;
  returns: number;
  cogs: number;
  profit: number;
  margin: number;
  count: number;
}

export interface MisDailyPoint {
  date: string;
  revenue: number;
  purchases: number;
}

export interface MisSummary {
  range: { startDate: string; endDate: string };
  kpis: MisKpis;
  categoryBreakdown: MisCategoryRow[];
  dailySeries: MisDailyPoint[];
}

export interface MisExportRow {
  saleNumber: string;
  date: string;
  customer: string;
  gstin: string;
  phone: string;
  status: string;
  paymentStatus: string;
  itemName: string;
  itemType: string;
  quantity: number | string;
  weight: number | string;
  rate: number | string;
  sellingPrice: number | string;
  itemAmount: number | string;
  subtotal: number;
  discountAmount: number;
  additionalCharges: number;
  grandTotal: number;
  totalPaid: number;
  balance: number;
  paymentModes: string;
}

export const getMisSummary = async (startDate: string, endDate: string) => {
  const res = await API_INSTANCE.get<{ data: MisSummary }>(
    `/mis/summary?startDate=${startDate}&endDate=${endDate}`
  );
  return res.data;
};

export const getMisSalesExport = async (
  startDate: string,
  endDate: string
) => {
  const res = await API_INSTANCE.get<{
    data: { rows: MisExportRow[]; truncated: boolean };
  }>(`/mis/sales/export?startDate=${startDate}&endDate=${endDate}`);
  return res.data;
};

// ------------------------------------------------------------ Cash Book
export type CashMode = "cash" | "cheque" | "online" | "other";

export interface CashSplit {
  total: number;
  cash: number;
  cheque: number;
  online: number;
  other: number;
  count: number;
}

export interface CashBookRow {
  _id: string;
  date: string;
  direction: "in" | "out";
  party?: string;
  partyCode?: string;
  partyType: "customer" | "vendor" | "transporter";
  mode: CashMode;
  amount: number;
  kind: string;
  documentRef: string;
  documentNumber: string;
  reference?: string;
  notes?: string;
}

export interface CashBook {
  totals: { in: CashSplit; out: CashSplit; net: CashSplit };
  rows: CashBookRow[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
  truncated?: boolean;
}

export interface CashBookQuery {
  startDate: string;
  endDate: string;
  direction?: "all" | "in" | "out";
  mode?: "all" | CashMode;
  search?: string;
  page?: number;
  limit?: number;
  all?: boolean;
}

export const getCashBook = async (q: CashBookQuery) => {
  const p = new URLSearchParams({ startDate: q.startDate, endDate: q.endDate });
  if (q.direction && q.direction !== "all") p.append("direction", q.direction);
  if (q.mode && q.mode !== "all") p.append("mode", q.mode);
  if (q.search?.trim()) p.append("search", q.search.trim());
  if (q.all) p.append("all", "1");
  else {
    p.append("page", String(q.page || 1));
    p.append("limit", String(q.limit || 25));
  }
  const res = await API_INSTANCE.get<{ data: CashBook }>(`/mis/cash-book?${p}`);
  return res.data.data;
};

// ------------------------------------------------------- Customer Profit
export interface ProfitFigures {
  sales: number;
  returns: number;
  cost: number; // net of goods returned
  billsCost: number;
  returnsCost: number;
  profit: number;
  margin: number | null;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export interface CustomerProfitRow extends ProfitFigures {
  customerId: string;
  name: string;
  code: string;
  status?: string;
  /** false = no bills or returns in the range (all figures are 0). */
  hasActivity: boolean;
  /** Position in the full list (activity by profit, then the rest by name). */
  rank: number;
  bills: number;
  returnsCount: number;
}

export interface CustomerProfit {
  rows: CustomerProfitRow[];
  /** Whole range, whatever the search / page. */
  totals: ProfitFigures & { customers: number; customersWithActivity: number; bills: number };
  pagination: Pagination;
}

/**
 * Every customer, with the range's figures. Without page / limit the server
 * sends every row; with them it pages (and searches) server-side.
 */
export const getCustomerProfit = async (
  startDate: string,
  endDate: string,
  opts: { search?: string; page?: number; limit?: number } = {}
) => {
  const p = new URLSearchParams({ startDate, endDate });
  if (opts.search?.trim()) p.append("search", opts.search.trim());
  if (opts.page) p.append("page", String(opts.page));
  if (opts.limit) p.append("limit", String(opts.limit));
  const res = await API_INSTANCE.get<{ data: CustomerProfit }>(`/mis/customer-profit?${p}`);
  return res.data.data;
};

export interface CustomerProfitEntry extends ProfitFigures {
  type: "bill" | "sale-return" | "customer-return";
  number: string;
  date: string;
  status?: string;
  grandTotal?: number;
  /** Return rows: cost of the goods that came back (positive). */
  costBack?: number;
}

export interface CustomerProfitSummary {
  bills: number;
  returnsCount: number;
  sales: number;
  returns: number;
  netSales: number;
  billsCost: number;
  costBack: number;
  cost: number;
  profit: number;
  margin: number | null;
  firstBillDate: string | null;
  lastBillDate: string | null;
}

export interface CustomerProfitDetail {
  customer: { _id: string; name: string; code: string; status?: string };
  range: { allTime: boolean; startDate: string | null; endDate: string | null };
  summary: CustomerProfitSummary;
  entries: CustomerProfitEntry[];
  totals: ProfitFigures & { bills: number };
  pagination: Pagination;
}

/** No dates = the customer's whole history. Entries are paged (100 a page). */
export const getCustomerProfitDetail = async (
  customerId: string,
  range: { startDate?: string; endDate?: string } = {},
  opts: { page?: number; limit?: number } = {}
) => {
  const p = new URLSearchParams();
  if (range.startDate && range.endDate) {
    p.append("startDate", range.startDate);
    p.append("endDate", range.endDate);
  }
  if (opts.page) p.append("page", String(opts.page));
  if (opts.limit) p.append("limit", String(opts.limit));
  const qs = p.toString();
  const res = await API_INSTANCE.get<{ data: CustomerProfitDetail }>(
    `/mis/customer-profit/${customerId}${qs ? `?${qs}` : ""}`
  );
  return res.data.data;
};

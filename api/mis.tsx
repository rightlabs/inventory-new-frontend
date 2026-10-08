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
  partyType: "customer" | "vendor";
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

export interface CustomerProfitRow extends ProfitFigures {
  customerId: string;
  name: string;
  code: string;
  bills: number;
  returnsCount: number;
}

export interface CustomerProfit {
  rows: CustomerProfitRow[];
  totals: ProfitFigures & { customers: number; bills: number };
}

export const getCustomerProfit = async (startDate: string, endDate: string) => {
  const res = await API_INSTANCE.get<{ data: CustomerProfit }>(
    `/mis/customer-profit?startDate=${startDate}&endDate=${endDate}`
  );
  return res.data.data;
};

export interface CustomerProfitEntry extends ProfitFigures {
  type: "bill" | "sale-return" | "customer-return";
  number: string;
  date: string;
  status?: string;
  grandTotal?: number;
}

export interface CustomerProfitDetail {
  customer: { _id: string; name: string; code: string };
  entries: CustomerProfitEntry[];
  totals: ProfitFigures & { bills: number };
}

export const getCustomerProfitDetail = async (
  customerId: string,
  startDate: string,
  endDate: string
) => {
  const res = await API_INSTANCE.get<{ data: CustomerProfitDetail }>(
    `/mis/customer-profit/${customerId}?startDate=${startDate}&endDate=${endDate}`
  );
  return res.data.data;
};

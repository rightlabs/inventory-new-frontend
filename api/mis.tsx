import API_INSTANCE from "./index";

export interface MisKpis {
  totalRevenue: number;
  itemRevenue: number;
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
  revenue: number;
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

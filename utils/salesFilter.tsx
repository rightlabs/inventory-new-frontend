// utils/saleFilters.ts
import { Sale } from "@/api/sale";

export interface SaleFilters {
  page?: number;
  limit?: number;
  status?: Sale["status"];
  paymentStatus?: Sale["paymentStatus"];
  startDate?: string;
  endDate?: string;
  customerId?: string;
}

export const buildSaleFilterQuery = (filters: SaleFilters) => {
  const queryParams = new URLSearchParams();

  if (filters.page) queryParams.append("page", filters.page.toString());
  if (filters.limit) queryParams.append("limit", filters.limit.toString());
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.paymentStatus)
    queryParams.append("paymentStatus", filters.paymentStatus);
  if (filters.startDate) queryParams.append("startDate", filters.startDate);
  if (filters.endDate) queryParams.append("endDate", filters.endDate);
  if (filters.customerId) queryParams.append("customerId", filters.customerId);

  return queryParams.toString();
};

export const defaultSaleFilters: SaleFilters = {
  page: 1,
  limit: 10,
};

export const formatSaleDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
};

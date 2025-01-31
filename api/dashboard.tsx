import { DashboardMetrics, InventoryStats } from "@/types/type";
import API_INSTANCE from "./index";
import { DashboardData, InventoryData } from "@/app/(dashboard)/dashboard/page";

export const getDashboardStats = async (
  period?: "day" | "week" | "month" | "year"
) => {
  try {
    const queryParams = period ? `?period=${period}` : "";
    const res = await API_INSTANCE.get<{ data: DashboardData }>(
      `/dashboard/stats${queryParams}`
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to fetch dashboard statistics");
  }
};

export const getInventoryStats = async () => {
  try {
    const res = await API_INSTANCE.get<{ data: InventoryData }>(
      "/dashboard/inventory"
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to fetch inventory statistics");
  }
};

// Optional: Add filtering capabilities for inventory stats
export interface InventoryFilters {
  category?: string;
  lowStock?: boolean;
  search?: string;
  sortBy?: "value" | "stock" | "name";
  order?: "asc" | "desc";
}

export const getFilteredInventoryStats = async (filters?: InventoryFilters) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }

    const res = await API_INSTANCE.get<{ data: InventoryStats }>(
      `/dashboard/inventory?${queryParams.toString()}`
    );
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to fetch filtered inventory statistics");
  }
};

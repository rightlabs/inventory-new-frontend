import API_INSTANCE from "./index";

export interface DashboardMetrics {
  grossSales: {
    total: number;
    percentageChange: number;
    todayAmount: number;
  };
  averageSales: {
    total: number;
    percentageChange: number;
    todayAmount: number;
  };
  newSales: {
    total: number;
    percentageChange: number;
    todayAmount: number;
  };
  grossProfits: {
    total: number;
    percentageChange: number;
    todayAmount: number;
  };
}

export interface RecentSale {
  name: string;
  email: string;
  amount: string;
  status: "pending" | "delivered" | "processing";
}

export interface MonthlyData {
  month: string;
  revenue: number;
  costs: number;
}

export interface DashboardStats {
  metrics: DashboardMetrics;
  recentSales: RecentSale[];
  monthlyData: MonthlyData[];
}

export interface InventoryCategory {
  _id: string;
  totalValue: number;
  itemCount: number;
}

export interface TopItem {
  _id: string;
  name: string;
  itemType: string;
  currentStock: number;
  purchaseRate: number;
  code: string;
}

export interface InventoryTransaction {
  _id: string;
  item: {
    _id: string;
    name: string;
  };
  type: "in" | "out";
  quantity: number;
  documentRef: "Purchase" | "Sale";
  documentNumber: string;
  date: string;
}

export interface InventoryStats {
  stats: {
    totalItems: number;
    lowStockItems: number;
    valueByCategory: InventoryCategory[];
    topItems: TopItem[];
  };
  recentTransactions: InventoryTransaction[];
}

export const getDashboardStats = async (
  period?: "day" | "week" | "month" | "year"
) => {
  try {
    const queryParams = period ? `?period=${period}` : "";
    const res = await API_INSTANCE.get<{ data: DashboardStats }>(
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
    const res = await API_INSTANCE.get<{ data: InventoryStats }>(
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

import { ApiResponse, InventoryItem, ItemFilters } from "@/types/type";
import API_INSTANCE from "./index";

export const getItems = async (filters: ItemFilters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.type) {
      queryParams.append("type", filters.type);
    }

    if (filters.subCategory && filters.subCategory !== "all") {
      if (filters.type === "Polish") {
        queryParams.append("type", filters.subCategory);
      } else {
        queryParams.append("subCategory", filters.subCategory);
      }
    }

    if (filters.searchTerm) {
      queryParams.append("search", filters.searchTerm);
    }

    if (filters.startDate) {
      queryParams.append("startDate", filters.startDate);
    }

    if (filters.endDate) {
      queryParams.append("endDate", filters.endDate);
    }

    const res = await API_INSTANCE.get<ApiResponse<InventoryItem[]>>(
      `/items?${queryParams}`
    );

    return res;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const createItem = async (data: Omit<InventoryItem, "_id">) => {
  try {
    const res = await API_INSTANCE.post<ApiResponse<InventoryItem>>(
      "/items",
      data
    );
    return res;
  } catch (error) {
    throw error;
  }
};

export const updateItem = async (
  itemId: string,
  data: Partial<InventoryItem>
) => {
  try {
    const res = await API_INSTANCE.put<ApiResponse<InventoryItem>>(
      `/items/${itemId}`,
      data
    );
    return res;
  } catch (error) {
    throw error;
  }
};

export const getItemHistory = async (
  itemId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
  }
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters?.startDate) queryParams.append("startDate", filters.startDate);
    if (filters?.endDate) queryParams.append("endDate", filters.endDate);

    const res = await API_INSTANCE.get(
      `/items/${itemId}/history?${queryParams}`
    );
    return res;
  } catch (error) {
    throw error;
  }
};

export const getPurchaseHistory = async (itemId: string) => {
  try {
    const res = await API_INSTANCE.get(`/items/${itemId}/purchase-history`);
    return res;
  } catch (error) {
    throw error;
  }
};

export interface InventoryReturnLine {
  itemId: string;
  weight?: number;
  quantity?: number;
  pieces?: number;
  rate: number;
}

export const addInventoryReturn = async (data: {
  date?: string;
  notes?: string;
  /** Optional: credit the return total to this customer's ledger. */
  customerId?: string;
  items: InventoryReturnLine[];
}) => {
  try {
    const res = await API_INSTANCE.post("/items/return", data);
    return res;
  } catch (error) {
    throw error;
  }
};

// Default return price per item for a customer: unit price on their last
// sale of the item (source "last_sale"), else the item's selling rate.
export interface ReturnPriceHint {
  unitPrice: number;
  source: "last_sale" | "selling_rate";
  saleNumber?: string;
  saleDate?: string;
}

export const getReturnPrices = async (customerId: string, itemIds: string[]) => {
  const res = await API_INSTANCE.get<{ data: Record<string, ReturnPriceHint> }>(
    `/items/return/prices?customerId=${encodeURIComponent(
      customerId
    )}&itemIds=${itemIds.map(encodeURIComponent).join(",")}`
  );
  return res.data.data;
};

export interface InventoryReturnRecord {
  _id: string;
  returnNumber: string;
  date: string;
  customer?: { _id: string; businessName: string; customerId: string } | null;
  items: {
    name: string;
    weight?: number;
    pieces?: number;
    quantity?: number;
    rate: number;
    amount: number;
  }[];
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export const getInventoryReturns = async (limit = 100) => {
  const res = await API_INSTANCE.get<{ data: InventoryReturnRecord[] }>(
    `/items/return?limit=${limit}`
  );
  return res.data.data;
};

import API_INSTANCE from "./index";

export type ItemType = "PipeSheet" | "Fitting" | "Polish";

// Base item interface
interface BaseItem {
  _id: string;
  code: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  purchaseRate: number;
  sellingRate: number;
  margin: number;
  gst: number;
  lastPurchaseDate?: string;
  unitType: "weight" | "pieces";
  status: "in_stock" | "low_stock" | "out_of_stock";
}

// Specific item interfaces
export interface PipeSheetItem extends BaseItem {
  itemType: "PipeSheet";
  type: "pipe" | "sheet";
  grade: "304" | "202";
  size: string;
  gauge: string;
  weight: number;
}

export interface FittingItem extends BaseItem {
  itemType: "Fitting";
  subCategory: string;
  size: string;
  type: "Round" | "Square";
  variant?: "One Side" | "Two Side" | null;
  weight?: number;
}

export interface PolishItem extends BaseItem {
  itemType: "Polish";
  type: string;
  subCategory: string;
  specification: string;
  variant?: "One Side" | "Two Side" | null;
  size?: number;
}

export type InventoryItem = PipeSheetItem | FittingItem | PolishItem;

export interface ItemFilters {
  type?: ItemType;
  subCategory?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

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

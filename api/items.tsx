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

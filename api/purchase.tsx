// api/purchase.ts

import { PurchaseFormData } from "@/components/Forms/PurchaseForm";
import API_INSTANCE from "./index";

interface PurchaseFilters {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  vendorId?: string;
}

export const createPurchase = async (data: PurchaseFormData) => {
  try {
    const res = await API_INSTANCE.post("/purchase", data);
    return res;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to create purchase");
  }
};

export const getPurchases = async (filters?: PurchaseFilters) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }

    const res = await API_INSTANCE.get(`/purchase?${queryParams.toString()}`);
    return res;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to fetch purchases");
  }
};

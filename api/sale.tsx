import { Sale } from "@/types/type";
import API_INSTANCE from "./index";

export const createSale = async (data: Sale | any) => {
  try {
    const res = await API_INSTANCE.post("/sale", data);
    return res;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to create sale");
  }
};

export const getSales = async (filters?: {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }

    const res = await API_INSTANCE.get(`/sale?${queryParams.toString()}`);
    return res;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to fetch sales");
  }
};

export const getSaleDetails = async (saleId: string) => {
  try {
    const res = await API_INSTANCE.get(`/sale/${saleId}`);
    return res;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to fetch sale details");
  }
};

export const addSalePayment = async (
  saleId: string,
  data: {
    amount: number;
    mode: "cash" | "cheque" | "online";
    reference?: string;
    notes?: string;
  }
) => {
  try {
    const res = await API_INSTANCE.post(`/sale/${saleId}/payments`, data);
    return res;
  } catch (error) {
    throw error;
  }
};

export const downloadSaleInvoice = async (saleId: string) => {
  return API_INSTANCE.get(`/sale/${saleId}/invoice`, {
    responseType: "blob",
  });
};

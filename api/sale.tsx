// api/sale.ts
import API_INSTANCE from "./index";
export interface SaleItem {
  name: string;
  type: "pipe" | "sheet" | "fitting" | "polish";
  size?: string;
  gauge?: string;
  category?: string;
  subCategory?: string;
  pieces?: number;
  weight?: number;
  rate: number;
  amount: number;
  gst: number;
  gstAmount: number;
}

export interface SaleFormData {
  customerId: string;
  date: Date;
  items: SaleItem[];
  paymentTerms?: string;
  deliveryAddress?: string;
  vehicleNo?: string;
  discount: number;
  taxableAmount: number;
  discountAmount: number;
  totalTax: number;
  grandTotal: number;
  payments?: {
    amount: number;
    mode: "cash" | "cheque" | "online";
    reference?: string;
    date: Date;
  }[];
  balanceAmount: number;
}

export interface Sale {
  _id: string;
  saleNumber: string;
  date: string;
  customer: {
    _id: string;
    name: string;
    gstin: string;
    type: string;
  };
  itemCount: number;
  totalAmount: number;
  discount: number;
  gstAmount: number;
  grandTotal: number;
  balanceAmount: number;
  status: "draft" | "processing" | "completed" | "cancelled";
  paymentStatus: "pending" | "partial" | "paid";
}

interface SaleFilters {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
}

export const createSale = async (data: SaleFormData) => {
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

export const getSales = async (filters?: SaleFilters) => {
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

// Add to the existing api/sale.ts file

export const downloadSaleInvoice = async (saleId: string) => {
  try {
    const response = await API_INSTANCE.get(`/sale/${saleId}/invoice`, {
      responseType: "blob", // Important for handling PDF data
    });
    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to download invoice");
  }
};

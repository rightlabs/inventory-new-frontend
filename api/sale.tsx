import API_INSTANCE from "./index";

export interface SaleItem {
  item: string;
  name: string;
  type: "pipe" | "sheet" | "fitting" | "polish";
  quantity?: number;
  weight?: number;
  rate: number;
  margin: number;
  sellingPrice: number;
  amount: number;
  gst: number;
  gstAmount: number;
}

export interface Sale {
  customerId: string;
  date: Date;
  deliveryAddress?: string;
  vehicleNo?: string;
  items: SaleItem[];
  discount: number;
  taxableAmount: number;
  totalTax: number;
  discountAmount: number;
  grandTotal: number;
  payments?: {
    amount: number;
    mode: "cash" | "cheque" | "online";
    reference?: string;
    date: Date;
  }[];
}

export interface SaleResponse {
  _id: string;
  saleNumber: string;
  date: string;
  customer: {
    _id: string;
    name: string;
    gstin: string;
  };
  itemCount: number;
  totalAmount: number;
  discount: number;
  gstAmount: number;
  grandTotal: number;
  balanceAmount: number;
  status: "draft" | "processing" | "completed";
  paymentStatus: "unpaid" | "partial" | "paid";
}

export const createSale = async (data: Sale) => {
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

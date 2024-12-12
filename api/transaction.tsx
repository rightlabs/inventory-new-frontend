import API_INSTANCE from "./index";

export const getVendorLedger = async (
  vendorId: string,
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
      `/ledger/vendor/${vendorId}?${queryParams}`
    );
    return res;
  } catch (error) {
    throw error;
  }
};

export const addPayment = async (
  purchaseId: string,
  data: {
    amount: number;
    mode: "cash" | "cheque" | "online";
    reference?: string;
    notes?: string;
  }
) => {
  try {
    const res = await API_INSTANCE.post(
      `/purchase/${purchaseId}/payments`,
      data
    );
    return res;
  } catch (error) {
    throw error;
  }
};

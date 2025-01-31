// api/customer.ts
import API_INSTANCE from "./index";

export const getCustomers = async () => {
  try {
    const res = await API_INSTANCE.get("/customer");
    return res;
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
};

export const addCustomer = async (data: object) => {
  try {
    const res = await API_INSTANCE.post("/customer", data);
    return res;
  } catch (error) {
    console.error("Error adding customer:", error);
    throw error;
  }
};

export const getCustomerLedger = async (
  customerId: string,
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
      `/ledger/customer/${customerId}?${queryParams}`
    );
    return res;
  } catch (error) {
    throw error;
  }
};

export const getCustomerTotalSales = async (customerId: string) => {
  try {
    const response = await API_INSTANCE.get(
      `/customer/${customerId}/total-sales`
    );
    return response;
  } catch (error) {
    throw error;
  }
};

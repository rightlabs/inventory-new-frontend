import API_INSTANCE from "./index";
import type { AccountPaymentData } from "./customer";

export const getVendors = async () => {
  try {
    const res = await API_INSTANCE.get("/vendor");
    return res;
  } catch (error) {
    console.log(error);
  }
};

export const addVendor = async (data: object) => {
  try {
    const res = await API_INSTANCE.post("/vendor", data);
    return res;
  } catch (error) {
    console.log(error);
  }
};

// Record a payment made to a vendor on account (VPAY-0001…). Errors are
// re-thrown so the caller can keep its form open (the axios interceptor
// already shows the server message as a toast).
export const recordVendorPayment = async (
  vendorId: string,
  data: AccountPaymentData
) => API_INSTANCE.post(`/vendor/${vendorId}/payment`, data);

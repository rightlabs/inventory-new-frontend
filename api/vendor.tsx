import API_INSTANCE from "./index";

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

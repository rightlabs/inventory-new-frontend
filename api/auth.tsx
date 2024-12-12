import API_INSTANCE from "./index";

export const userLogin = async (data: object) => {
  const res = await API_INSTANCE.post("/user/login", data);
  return res;
};

export const getCurrentUser = async () => {
  try {
    const res = await API_INSTANCE.get("/user/current-user");
    return res;
  } catch (error) {
    console.log(error);
  }
};

export const userLogout = async () => {
  try {
    const res = await API_INSTANCE.post("/user/logout");
    return res;
  } catch (error) {
    console.log(error);
  }
};

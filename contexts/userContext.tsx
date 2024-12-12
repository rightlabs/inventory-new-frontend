"use client";
import { getCurrentUser } from "@/api/auth";
import { getToken } from "@/utils/getToken";
import { createContext, useContext, useEffect, useState } from "react";

export const UserContext = createContext({});

interface User {
  data: {
    name: string;
    email: string;
  };
}

export const UserContextProvider = ({ children }: any) => {
  const [user, setUser] = useState<User["data"] | undefined>();
  const token = getToken();

  const fetchCurrentUser = async () => {
    try {
      const response: User | undefined = await getCurrentUser();
      if (!response) return;
      setUser(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchCurrentUser();
  }, [token]);

  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

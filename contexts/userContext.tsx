"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getCurrentUser } from "@/api/auth";
import { getToken } from "@/utils/getToken";
import { User } from "@/types/type";

interface UserContextType {
  user: User | undefined;
}

export const UserContext = createContext<UserContextType>({ user: undefined });

interface UserContextProviderProps {
  children: ReactNode;
}

export const UserContextProvider = ({ children }: UserContextProviderProps) => {
  const [user, setUser] = useState<User | undefined>();
  const token = getToken();

  const fetchCurrentUser = async () => {
    try {
      const response = await getCurrentUser();
      if (response?.data?.statusCode === 200) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
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

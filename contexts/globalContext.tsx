"use client";
import { createContext, useContext } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { UserContextProvider } from "./userContext";

const GlobalContext = createContext({});

export const GlobalContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <GlobalContext.Provider value={{}}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <UserContextProvider>{children}</UserContextProvider>
      </ThemeProvider>
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => useContext(GlobalContext);

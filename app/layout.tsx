import { metadata } from "@/app/meta-data";
import "./globals.css";
import { Inter } from "next/font/google";
import ClientLayout from "@/app/client-layout";
import { GlobalContextProvider } from "@/contexts/globalContext";

const inter = Inter({ subsets: ["latin"] });

export { metadata };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <GlobalContextProvider>
          <ClientLayout>{children}</ClientLayout>
        </GlobalContextProvider>
      </body>
    </html>
  );
}

import ClientLayout from "@/app/(dashboard)/client-layout";
import { GlobalContextProvider } from "@/contexts/globalContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalContextProvider>
      <ClientLayout>{children}</ClientLayout>
    </GlobalContextProvider>
  );
}

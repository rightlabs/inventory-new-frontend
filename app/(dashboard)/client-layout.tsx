"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Header />
        {/* Only <main> scrolls. Smaller padding below lg (phones/tablets). */}
        <main className="relative flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

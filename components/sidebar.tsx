"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  IndianRupee,
  Building2,
  Store,
  Warehouse,
} from "lucide-react";
import LogoutButton from "./logout-button";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Purchases",
    icon: ShoppingCart,
    href: "/purchase",
  },
  {
    label: "Vendors",
    icon: Building2, // Changed to represent business entities
    href: "/vendors",
  },
  {
    label: "Sales Orders",
    icon: IndianRupee, // Changed to Indian Rupee symbol
    href: "/sales",
  },
  {
    label: "Customers",
    icon: Store, // Changed to represent retail/business customers
    href: "/customers",
  },
  {
    label: "Inventory",
    icon: Warehouse, // Changed to better represent inventory storage
    href: "/inventory",
  },
  // {
  //   label: "Analytics",
  //   icon: BarChart3,
  //   href: "/analytics",
  // },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full w-64 bg-[#F8FAFC] border-r border-gray-200">
      <div className="p-6">
        <h1 className="text-xl font-bold text-text flex items-center tracking-tight">
          Gayatri Industries
        </h1>
      </div>
      <div className="flex-1 px-3 flex flex-col gap-y-5">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-x-2  text-[#64748B] text-base font-medium px-3 py-3 rounded-lg hover:bg-[#F1F5F9] transition-colors",
              pathname === route.href && "bg-[#F1F5F9] text-[#7C3AED]"
            )}
          >
            <route.icon
              className={cn(
                "h-5 w-5",
                pathname === route.href && "text-primary"
              )}
            />
            {route.label}
          </Link>
        ))}
      </div>
      {/* Logout section at bottom */}
      <div className="border-t border-gray-200 p-3">
        <LogoutButton />
      </div>
    </div>
  );
}

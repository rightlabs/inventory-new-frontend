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
import { useUser } from "@/contexts/userContext";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    roles: ["admin"], // Only admin can see dashboard
  },
  {
    label: "Purchases",
    icon: ShoppingCart,
    href: "/purchase",
    roles: ["admin", "sales"],
  },
  {
    label: "Vendors",
    icon: Building2,
    href: "/vendors",
    roles: ["admin", "sales"],
  },
  {
    label: "Sales Orders",
    icon: IndianRupee,
    href: "/sales",
    roles: ["admin", "sales"],
  },
  {
    label: "Customers",
    icon: Store,
    href: "/customers",
    roles: ["admin", "sales"],
  },
  {
    label: "Inventory",
    icon: Warehouse,
    href: "/inventory",
    roles: ["admin", "sales"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  // Filter routes based on user role
  const filteredRoutes = routes.filter(
    (route) => !user?.role || route.roles.includes(user.role)
  );

  return (
    <div className="flex flex-col h-full w-64 bg-[#F8FAFC] border-r border-gray-200">
      <div className="p-6">
        <h1 className="text-xl font-bold text-text flex items-center tracking-tight">
          Gayatri Industries
        </h1>
      </div>
      <div className="flex-1 px-3 flex flex-col gap-y-5">
        {filteredRoutes.map((route) => (
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

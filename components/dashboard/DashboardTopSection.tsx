"use client";
import { useUser } from "@/contexts/userContext";
import React from "react";
import { ChevronDown } from "lucide-react"; // Import ChevronDown icon if you're using lucide-react

interface DashboardTopSectionProps {}

const DashboardTopSection = ({}: DashboardTopSectionProps) => {
  const { user } = useUser();

  const periods = [
    { label: "Last year", value: "year" },
    { label: "Last month", value: "month" },
    { label: "Last week", value: "week" },
  ];

  return (
    <div className="flex items-center justify-between w-full">
      <div className="space-y-1">
        <h2 className="text-[1.875rem] font-semibold tracking-tight text-[#1E293B]">
          Hi, {user ? `${user?.firstName} ${user?.lastName}!` : "User"}
        </h2>
        <p className="text-[#64748B]">
          Here's what's happening with your store today.
        </p>
      </div>
      {/* <div className="flex items-center space-x-2">
        <div className="relative">
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default DashboardTopSection;

"use client";
import { useUser } from "@/contexts/userContext";
import React from "react";

const DashboardTopSection = () => {
  const { user } = useUser();
  return (
    <div className="flex items-center justify-between w-full">
      <div className="space-y-1">
        <h2 className="text-[1.875rem] font-semibold tracking-tight text-[#1E293B]">
          Hi, {user ? `${user?.firstName + " " + user?.lastName}!` : "User"}
        </h2>
        <p className="text-[#64748B]">
          Here's what's happening with your store today.
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option>Last year</option>
          <option>Last month</option>
          <option>Last week</option>
        </select>
        <button className="bg-[#7C3AED] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 hover:bg-[#6D28D9] transition-colors">
          <span>Export</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DashboardTopSection;

"use client";
import { getDashboardStats, getInventoryStats } from "@/api/dashboard";
import {
  DashboardMetrics,
  MonthlyData,
  InventoryStats,
  ApiResponse,
} from "@/types/type";
import DashboardTopSection from "@/components/dashboard/DashboardTopSection";
import { InventoryStatus } from "@/components/dashboard/InventoryStatus";
import { RevenueSummary } from "@/components/dashboard/RevenueSummary";
import { StatsCards } from "@/components/stats-cards";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

export interface DashboardData {
  metrics: DashboardMetrics;
  monthlyData: MonthlyData[];
}

export interface InventoryData {
  stats: InventoryStats;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(
    null
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, inventoryRes] = await Promise.all([
          getDashboardStats(),
          getInventoryStats(),
        ]);
        setDashboardData(dashboardRes.data);
        setInventoryData(inventoryRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  if (!dashboardData || !inventoryData)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );

  return (
    <div className="flex-1 space-y-6 ">
      <DashboardTopSection />

      {/* First Row - Stats Cards */}
      <StatsCards metrics={dashboardData.metrics} />

      {/* Second Row - Inventory Overview */}
      <div className="grid gap-6 ">
        <Card>
          <div className="p-6 w-full">
            <h3 className="text-base font-medium text-gray-900 mb-4">
              Inventory Status
            </h3>
            <InventoryStatus stats={inventoryData.stats} />
          </div>
        </Card>
      </div>

      {/* Third Row - Revenue Graph */}
      <Card>
        <div className="p-6">
          <RevenueSummary data={dashboardData.monthlyData} />
        </div>
      </Card>
    </div>
  );
}

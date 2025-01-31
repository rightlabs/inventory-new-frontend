"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Overview } from "@/components/overview";
import { RecentSales } from "@/components/recent-sales";
import { StatsCards } from "@/components/stats-cards";
import { InventoryOverview } from "@/components/dashboard/InventoryOverview";
import { InventoryStatus } from "@/components/dashboard/InventoryStatus";
import DashboardTopSection from "@/components/dashboard/DashboardTopSection";
import { getDashboardStats, getInventoryStats } from "@/api/dashboard";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [period, setPeriod] = useState("week");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, inventoryRes] = await Promise.all([
          getDashboardStats(period),
          getInventoryStats(),
        ]);
        setDashboardData(dashboardRes.data);
        setInventoryData(inventoryRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, [period]);

  if (!dashboardData || !inventoryData) return <div>Loading...</div>;

  return (
    <div className="flex-1 space-y-6 ">
      <DashboardTopSection period={period} onPeriodChange={setPeriod} />

      <StatsCards metrics={dashboardData.metrics} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="col-span-1">
          <div className="p-6">
            <h3 className="text-base font-medium text-gray-900 mb-4">
              Revenue vs Costs
            </h3>
            <Overview data={dashboardData.monthlyData} />
          </div>
        </Card>
        <Card className="col-span-1">
          <div className="p-6">
            <h3 className="text-base font-medium text-gray-900 mb-4">
              Recent Sales
            </h3>
            <RecentSales sales={dashboardData.recentSales} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="col-span-1">
          <div className="p-6">
            <h3 className="text-base font-medium text-gray-900 mb-4">
              Inventory Status
            </h3>
            <InventoryStatus stats={inventoryData.stats} />
          </div>
        </Card>
        <Card className="col-span-1">
          <div className="p-6">
            <h3 className="text-base font-medium text-gray-900 mb-4">
              Inventory Overview
            </h3>
            <InventoryOverview
              categories={inventoryData.stats.valueByCategory}
              transactions={inventoryData.recentTransactions.slice(0, 3)}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

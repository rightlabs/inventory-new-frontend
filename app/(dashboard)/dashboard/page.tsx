import { Card } from "@/components/ui/card";
import { Overview } from "@/components/overview";
import { RecentSales } from "@/components/recent-sales";
import { StatsCards } from "@/components/stats-cards";
import DashboardTopSection from "@/components/dashboard/DashboardTopSection";

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-0 bg-[#F8FAFC]">
      <div className="flex items-center justify-between">
        <DashboardTopSection />
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border border-gray-100 shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-medium text-[#1E293B]">
              Revenue vs Costs
            </h3>
            <Overview />
          </div>
        </Card>
        <Card className="col-span-3 border border-gray-100 shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-medium text-[#1E293B]">Recent Sales</h3>
            <RecentSales />
          </div>
        </Card>
      </div>
    </div>
  );
}

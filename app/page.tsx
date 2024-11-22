import { Card } from "@/components/ui/card";
import { Overview } from "@/components/overview";
import { RecentSales } from "@/components/recent-sales";
import { StatsCards } from "@/components/stats-cards";

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-0 bg-[#F8FAFC]">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-[1.875rem] font-semibold tracking-tight text-[#1E293B]">
            Morning, Ashutosh Ji!
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

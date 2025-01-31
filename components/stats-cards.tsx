// components/stats-cards.tsx
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { DashboardMetrics } from "@/api/dashboard";

interface StatsCardProps {
  title: string;
  amount: number;
  percentageChange: number;
  todayAmount: string | number;
  isNegative?: boolean;
}

function StatsCard({
  title,
  amount,
  percentageChange,
  todayAmount,
  isNegative,
}: StatsCardProps) {
  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-base text-gray-500">{title}</p>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-semibold text-gray-900">
                ₹{amount.toLocaleString()}
              </h3>
              <div className="flex items-center text-sm">
                {isNegative ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                )}
                <span
                  className={`ml-1 ${
                    isNegative ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {Math.abs(percentageChange)}%
                </span>
              </div>
            </div>
            <span className="text-sm text-gray-500 mt-1">
              {isNegative ? "-" : "+"}
              {todayAmount} today
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Gross Sales"
        amount={metrics.grossSales.total}
        percentageChange={metrics.grossSales.percentageChange}
        todayAmount={metrics.grossSales.todayAmount.toLocaleString()}
      />
      <StatsCard
        title="Average Sales"
        amount={metrics.averageSales.total}
        percentageChange={metrics.averageSales.percentageChange}
        todayAmount={metrics.averageSales.todayAmount.toLocaleString()}
      />
      <StatsCard
        title="New Sales"
        amount={metrics.newSales.total}
        percentageChange={metrics.newSales.percentageChange}
        todayAmount={metrics.newSales.todayAmount.toLocaleString()}
        isNegative={metrics.newSales.percentageChange < 0}
      />
      <StatsCard
        title="Gross Profits"
        amount={metrics.grossProfits.total}
        percentageChange={metrics.grossProfits.percentageChange}
        todayAmount={metrics.grossProfits.todayAmount.toLocaleString()}
      />
    </div>
  );
}

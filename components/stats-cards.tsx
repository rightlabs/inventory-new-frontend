// components/stats-cards.tsx
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { DashboardMetrics } from "@/api/dashboard";

interface StatsCardProps {
  title: string;
  amount: number;
  percentageChange: number | string;
  todayAmount: number;
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
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-semibold text-gray-900">
                ₹
                {Math.abs(amount).toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </h3>
              <div className="flex items-center text-sm">
                {percentageChange !== "Infinity" && (
                  <>
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
                      {typeof percentageChange === "number"
                        ? `${Math.abs(percentageChange).toFixed(1)}%`
                        : percentageChange}
                    </span>
                  </>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {isNegative ? "-" : "+"}
              {Math.abs(todayAmount).toLocaleString("en-IN", {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}{" "}
              today
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid gap-6 grid-cols-3">
      <StatsCard
        title="Total Sales"
        amount={metrics.totalSales.total}
        percentageChange={metrics.totalSales.percentageChange}
        todayAmount={metrics.totalSales.todayAmount}
      />
      <StatsCard
        title="Total Purchase"
        amount={metrics.totalPurchase.total}
        percentageChange={metrics.totalPurchase.percentageChange}
        todayAmount={metrics.totalPurchase.todayAmount}
      />
      <StatsCard
        title="Gross Profits"
        amount={metrics.grossProfits.total}
        percentageChange={metrics.grossProfits.percentageChange}
        todayAmount={metrics.grossProfits.todayAmount}
        isNegative={metrics.grossProfits.total < 0}
      />
    </div>
  );
}

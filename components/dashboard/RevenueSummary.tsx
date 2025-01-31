import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MonthlyData } from "@/types/type";

interface RevenueSummaryProps {
  data: MonthlyData[];
}

interface TooltipFormatterProps {
  value: number;
  name: string;
  entry: MonthlyData;
}

export function RevenueSummary({ data }: RevenueSummaryProps) {
  // Calculate totals for summary
  const totalRevenue = data.reduce((acc, month) => acc + month.revenue, 0);
  const totalCosts = data.reduce((acc, month) => acc + month.costs, 0);
  const netProfit = totalRevenue - totalCosts;

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      <div className="col-span-2 bg-white rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-600 mb-4">
          Revenue vs Costs
        </h4>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value: number) => `₹${value / 1000}K`} />
              <Tooltip
                formatter={(value: number) => [
                  `₹${value.toLocaleString()}`,
                  "",
                ]}
                labelStyle={{ color: "#1E293B" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#7C3AED"
                name="Revenue"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="costs"
                stroke="#E11D48"
                name="Costs"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-600 mb-4">
          Financial Summary
        </h4>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-lg font-medium text-green-600">
              ₹{totalRevenue.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Costs</p>
            <p className="text-lg font-medium text-red-600">
              ₹{totalCosts.toLocaleString()}
            </p>
          </div>
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-500">Net Profit</p>
            <p
              className={`text-lg font-medium ${
                netProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ₹{netProfit.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

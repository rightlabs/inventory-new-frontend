"use client";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface MonthlyData {
  month: string;
  revenue: number;
  costs: number;
}

interface OverviewProps {
  data: MonthlyData[];
}

export function Overview({ data }: OverviewProps) {
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div className="h-[350px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
        >
          <XAxis
            dataKey="month"
            stroke="#94A3B8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip
            cursor={{ fill: "#F1F5F9" }}
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "6px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            }}
            labelStyle={{ color: "#1E293B", fontWeight: 500 }}
            formatter={(value) => [`₹${value.toLocaleString()}`]}
          />
          <Bar
            dataKey="revenue"
            fill="#7C3AED"
            radius={[4, 4, 0, 0]}
            name="Revenue"
          />
          <Bar
            dataKey="costs"
            fill="#A5B4FC"
            radius={[4, 4, 0, 0]}
            name="Costs"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const data = [
  { month: "Jan", revenue: 4000, costs: 2400 },
  { month: "Feb", revenue: 3000, costs: 1398 },
  { month: "Mar", revenue: 2000, costs: 9800 },
  { month: "Apr", revenue: 2780, costs: 3908 },
  { month: "May", revenue: 1890, costs: 4800 },
  { month: "Jun", revenue: 2390, costs: 3800 },
  { month: "Jul", revenue: 3490, costs: 4300 },
  { month: "Aug", revenue: 4000, costs: 2400 },
  { month: "Sep", revenue: 3000, costs: 1398 },
  { month: "Oct", revenue: 2000, costs: 9800 },
  { month: "Nov", revenue: 2780, costs: 3908 },
  { month: "Dec", revenue: 1890, costs: 4800 },
];

export function Overview() {
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
            tickFormatter={(value) => `₹${value}`}
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

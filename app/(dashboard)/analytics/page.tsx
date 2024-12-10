"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDown,
  ArrowUp,
  Download,
  IndianRupee,
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Interfaces for type safety
interface FinancialMetric {
  label: string;
  value: number;
  change: number;
  trend: "up" | "down";
  prefix?: string;
  format?: "currency" | "number" | "percentage";
}

interface ProfitLossItem {
  category: string;
  amount: number;
  previousAmount: number;
  change: number;
}

// Sample data
const monthlySales = [
  { month: "Jan", sales: 2356000, purchases: 1890000 },
  { month: "Feb", sales: 2890000, purchases: 2100000 },
  { month: "Mar", sales: 2760000, purchases: 1950000 },
  // ... add more months
];

const categoryDistribution = [
  { name: "Pipes", value: 45 },
  { name: "Sheets", value: 25 },
  { name: "Fittings", value: 20 },
  { name: "Polish Items", value: 10 },
];

const plData = {
  revenue: [
    {
      category: "Pipe Sales",
      amount: 2890000,
      previousAmount: 2650000,
      change: 9.1,
    },
    {
      category: "Sheet Sales",
      amount: 1560000,
      previousAmount: 1420000,
      change: 9.9,
    },
    {
      category: "Fittings Sales",
      amount: 980000,
      previousAmount: 850000,
      change: 15.3,
    },
    {
      category: "Polish Items Sales",
      amount: 450000,
      previousAmount: 380000,
      change: 18.4,
    },
  ],
  expenses: [
    {
      category: "Pipe Purchases",
      amount: 2100000,
      previousAmount: 1950000,
      change: 7.7,
    },
    {
      category: "Sheet Purchases",
      amount: 1200000,
      previousAmount: 1100000,
      change: 9.1,
    },
    {
      category: "Fittings Purchases",
      amount: 720000,
      previousAmount: 650000,
      change: 10.8,
    },
    {
      category: "Polish Items Purchases",
      amount: 280000,
      previousAmount: 250000,
      change: 12.0,
    },
    {
      category: "Operating Expenses",
      amount: 350000,
      previousAmount: 320000,
      change: 9.4,
    },
  ],
};

const COLORS = ["#7C3AED", "#EDC53A", "#3AEDC5", "#ED7C3A"];

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("month");

  // Calculate key metrics
  const totalRevenue = plData.revenue.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const totalExpenses = plData.expenses.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const grossProfit = totalRevenue - totalExpenses;
  const grossMargin = (grossProfit / totalRevenue) * 100;

  const metrics: FinancialMetric[] = [
    {
      label: "Total Revenue",
      value: totalRevenue,
      change: 12.5,
      trend: "up",
      prefix: "₹",
      format: "currency",
    },
    {
      label: "Gross Profit",
      value: grossProfit,
      change: 15.2,
      trend: "up",
      prefix: "₹",
      format: "currency",
    },
    {
      label: "Gross Margin",
      value: grossMargin,
      change: 2.3,
      trend: "up",
      format: "percentage",
    },
    {
      label: "Total Orders",
      value: 342,
      change: 8.1,
      trend: "up",
      format: "number",
    },
  ];

  // Format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Render metric card
  const MetricCard = ({ metric }: { metric: FinancialMetric }) => {
    const formattedValue =
      metric.format === "currency"
        ? formatCurrency(metric.value)
        : metric.format === "percentage"
        ? `${metric.value.toFixed(1)}%`
        : metric.value.toLocaleString();

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline">
                <h3 className="text-2xl font-semibold">{formattedValue}</h3>
              </div>
              <div
                className={`flex items-center gap-1 text-sm ${
                  metric.trend === "up"
                    ? "text-success-600"
                    : "text-destructive"
                }`}
              >
                {metric.trend === "up" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                {metric.change}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View financial reports and business insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select defaultValue="month" onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>

      {/* Tabs for different reports */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="category">Category Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Revenue vs Expenses Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
                <CardDescription>
                  Monthly comparison of revenue and expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#7C3AED"
                        name="Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="purchases"
                        stroke="#EDC53A"
                        name="Expenses"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Distribution</CardTitle>
                <CardDescription>
                  Distribution by product category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profit & Loss Tab */}
        <TabsContent value="profit-loss">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Profit & Loss Statement</CardTitle>
                  <CardDescription>
                    Detailed analysis of revenue and expenses
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" /> Export P&L
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Revenue</h3>
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle text-sm font-medium">
                            Category
                          </th>
                          <th className="h-12 px-4 text-right align-middle text-sm font-medium">
                            Amount
                          </th>
                          <th className="h-12 px-4 text-right align-middle text-sm font-medium">
                            Previous
                          </th>
                          <th className="h-12 px-4 text-right align-middle text-sm font-medium">
                            Change
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {plData.revenue.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-4">{item.category}</td>
                            <td className="p-4 text-right">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="p-4 text-right">
                              {formatCurrency(item.previousAmount)}
                            </td>
                            <td className="p-4 text-right">
                              <span
                                className={
                                  item.change >= 0
                                    ? "text-success-600"
                                    : "text-destructive"
                                }
                              >
                                {item.change >= 0 ? "+" : ""}
                                {item.change}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-b bg-muted/50 font-medium">
                          <td className="p-4">Total Revenue</td>
                          <td className="p-4 text-right">
                            {formatCurrency(totalRevenue)}
                          </td>
                          <td className="p-4 text-right"></td>
                          <td className="p-4 text-right"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Expenses Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Expenses</h3>
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle text-sm font-medium">
                            Category
                          </th>
                          <th className="h-12 px-4 text-right align-middle text-sm font-medium">
                            Amount
                          </th>
                          <th className="h-12 px-4 text-right align-middle text-sm font-medium">
                            Previous
                          </th>
                          <th className="h-12 px-4 text-right align-middle text-sm font-medium">
                            Change
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {plData.expenses.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-4">{item.category}</td>
                            <td className="p-4 text-right">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="p-4 text-right">
                              {formatCurrency(item.previousAmount)}
                            </td>
                            <td className="p-4 text-right">
                              <span
                                className={
                                  item.change >= 0
                                    ? "text-destructive"
                                    : "text-success-600"
                                }
                              >
                                {item.change >= 0 ? "+" : ""}
                                {item.change}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-b bg-muted/50 font-medium">
                          <td className="p-4">Total Expenses</td>
                          <td className="p-4 text-right">
                            {formatCurrency(totalExpenses)}
                          </td>
                          <td className="p-4 text-right"></td>
                          <td className="p-4 text-right"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="rounded-md border p-4 bg-muted/50">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Gross Profit
                      </p>
                      <p className="text-2xl font-semibold">
                        {formatCurrency(grossProfit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Gross Margin
                      </p>
                      <p className="text-2xl font-semibold">
                        {grossMargin.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Net Growth
                      </p>
                      <p className="text-2xl font-semibold text-success-600">
                        +12.5%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Category Analysis Tab */}
        <TabsContent value="category">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>
                  Revenue and profit by product category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={plData.revenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Legend />
                      <Bar
                        dataKey="amount"
                        fill="#7C3AED"
                        name="Current Period"
                      />
                      <Bar
                        dataKey="previousAmount"
                        fill="#EDC53A"
                        name="Previous Period"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Category Metrics</CardTitle>
                <CardDescription>
                  Key performance indicators by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle text-sm font-medium">
                          Category
                        </th>
                        <th className="h-12 px-4 text-right align-middle text-sm font-medium">
                          Revenue
                        </th>
                        <th className="h-12 px-4 text-right align-middle text-sm font-medium">
                          Growth
                        </th>
                        <th className="h-12 px-4 text-right align-middle text-sm font-medium">
                          Margin
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {plData.revenue.map((item, index) => {
                        const expense = plData.expenses[index];
                        const margin = (
                          ((item.amount - expense.amount) / item.amount) *
                          100
                        ).toFixed(1);

                        return (
                          <tr key={index} className="border-b">
                            <td className="p-4">{item.category}</td>
                            <td className="p-4 text-right">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="p-4 text-right">
                              <span
                                className={
                                  item.change >= 0
                                    ? "text-success-600"
                                    : "text-destructive"
                                }
                              >
                                {item.change >= 0 ? "+" : ""}
                                {item.change}%
                              </span>
                            </td>
                            <td className="p-4 text-right">{margin}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Stock Value by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Value</CardTitle>
                <CardDescription>
                  Current stock value by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Pipes", value: 1250000 },
                          { name: "Sheets", value: 850000 },
                          { name: "Fittings", value: 450000 },
                          { name: "Polish Items", value: 250000 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) =>
                          `${name} (${formatCurrency(value)})`
                        }
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>
                  Best performing products by revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle text-sm font-medium">
                          Product
                        </th>
                        <th className="h-12 px-4 text-right align-middle text-sm font-medium">
                          Revenue
                        </th>
                        <th className="h-12 px-4 text-right align-middle text-sm font-medium">
                          Units
                        </th>
                        <th className="h-12 px-4 text-right align-middle text-sm font-medium">
                          Profit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          name: "SS Pipe 80x80",
                          revenue: 580000,
                          units: 250,
                          profit: 145000,
                        },
                        {
                          name: "SS Sheet 8x4",
                          revenue: 420000,
                          units: 180,
                          profit: 126000,
                        },
                        {
                          name: "Ball with Nut",
                          revenue: 320000,
                          units: 1500,
                          profit: 96000,
                        },
                        {
                          name: "Flap Disc 60",
                          revenue: 180000,
                          units: 2000,
                          profit: 54000,
                        },
                      ].map((product, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-4">{product.name}</td>
                          <td className="p-4 text-right">
                            {formatCurrency(product.revenue)}
                          </td>
                          <td className="p-4 text-right">{product.units}</td>
                          <td className="p-4 text-right">
                            {formatCurrency(product.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Monthly Trends */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Monthly Performance Trends</CardTitle>
                <CardDescription>
                  Revenue, expenses, and profit trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        {
                          month: "Jan",
                          revenue: 2356000,
                          expenses: 1890000,
                          profit: 466000,
                        },
                        {
                          month: "Feb",
                          revenue: 2890000,
                          expenses: 2100000,
                          profit: 790000,
                        },
                        {
                          month: "Mar",
                          revenue: 2760000,
                          expenses: 1950000,
                          profit: 810000,
                        },
                        {
                          month: "Apr",
                          revenue: 3120000,
                          expenses: 2250000,
                          profit: 870000,
                        },
                        {
                          month: "May",
                          revenue: 2980000,
                          expenses: 2180000,
                          profit: 800000,
                        },
                        {
                          month: "Jun",
                          revenue: 3250000,
                          expenses: 2320000,
                          profit: 930000,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#7C3AED"
                        name="Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke="#EDC53A"
                        name="Expenses"
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke="#3AEDC5"
                        name="Profit"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Growth Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
                <CardDescription>
                  Year-over-year growth analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle text-sm font-medium">
                          Metric
                        </th>
                        <th className="h-12 px-4 text-right align-middle text-sm font-medium">
                          Current
                        </th>
                        <th className="h-12 px-4 text-right align-middle text-sm font-medium">
                          Previous
                        </th>
                        <th className="h-12 px-4 text-right align-middle text-sm font-medium">
                          Growth
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          metric: "Revenue",
                          current: 5880000,
                          previous: 5120000,
                          growth: 14.8,
                        },
                        {
                          metric: "Gross Profit",
                          current: 1680000,
                          previous: 1380000,
                          growth: 21.7,
                        },
                        {
                          metric: "Average Order Value",
                          current: 28500,
                          previous: 25800,
                          growth: 10.5,
                        },
                        {
                          metric: "Customer Count",
                          current: 185,
                          previous: 165,
                          growth: 12.1,
                        },
                      ].map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-4">{item.metric}</td>
                          <td className="p-4 text-right">
                            {item.metric.includes("Count")
                              ? item.current
                              : formatCurrency(item.current)}
                          </td>
                          <td className="p-4 text-right">
                            {item.metric.includes("Count")
                              ? item.previous
                              : formatCurrency(item.previous)}
                          </td>
                          <td className="p-4 text-right">
                            <span
                              className={
                                item.growth >= 0
                                  ? "text-success-600"
                                  : "text-destructive"
                              }
                            >
                              {item.growth >= 0 ? "+" : ""}
                              {item.growth}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Margin Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Margin Analysis</CardTitle>
                <CardDescription>
                  Profitability trends by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { category: "Pipes", current: 28.5, previous: 26.2 },
                        { category: "Sheets", current: 32.1, previous: 29.8 },
                        { category: "Fittings", current: 35.8, previous: 33.5 },
                        {
                          category: "Polish Items",
                          current: 38.2,
                          previous: 36.4,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                      <Bar
                        dataKey="current"
                        fill="#7C3AED"
                        name="Current Margin %"
                      />
                      <Bar
                        dataKey="previous"
                        fill="#EDC53A"
                        name="Previous Margin %"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

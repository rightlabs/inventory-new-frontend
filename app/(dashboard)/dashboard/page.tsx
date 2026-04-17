"use client";
import { getDashboardStats, getInventoryStats } from "@/api/dashboard";
import {
  DashboardMetrics,
  MonthlyData,
  InventoryStats,
  SummaryStats,
  TopSellingItem,
} from "@/types/type";
import DashboardTopSection from "@/components/dashboard/DashboardTopSection";
import { InventoryStatus } from "@/components/dashboard/InventoryStatus";
import { RevenueSummary } from "@/components/dashboard/RevenueSummary";
import { StatsCards } from "@/components/stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/userContext";
import {
  ShoppingCart,
  Users,
  Building2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  IndianRupee,
  HelpCircle,
  ShoppingBag,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface DashboardData {
  metrics: DashboardMetrics;
  summaryStats: SummaryStats;
  monthlyData: MonthlyData[];
  topSellingItems: TopSellingItem[];
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
  const router = useRouter();
  const { user } = useUser();

  // Redirect sales users to sales page - they don't have access to dashboard
  useEffect(() => {
    if (user?.role === "sales") {
      router.replace("/sales");
    }
  }, [user, router]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Show loading while checking role or loading data
  if (!dashboardData || !inventoryData || user?.role === "sales")
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );

  const { summaryStats, topSellingItems } = dashboardData;
  const totalInventoryValue = inventoryData.stats.valueByCategory.reduce(
    (acc, cat) => acc + cat.totalValue,
    0
  );

  return (
    <TooltipProvider>
    <div className="flex-1 space-y-6">
      <DashboardTopSection />

      {/* First Row - Main Financial Stats */}
      <StatsCards metrics={dashboardData.metrics} />

      {/* Second Row - Quick Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Orders */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Sales Orders
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50" /></TooltipTrigger>
                    <TooltipContent><p>अब तक कुल कितने बिल बने हैं</p></TooltipContent>
                  </Tooltip>
                </p>
                <p className="text-2xl font-bold">{summaryStats.totalSalesCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Purchase Orders
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50" /></TooltipTrigger>
                    <TooltipContent><p>अब तक कुल कितनी खरीदारी हुई है</p></TooltipContent>
                  </Tooltip>
                </p>
                <p className="text-2xl font-bold">{summaryStats.totalPurchaseCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Active Customers
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50" /></TooltipTrigger>
                    <TooltipContent><p>कितने ग्राहक अभी चालू हैं</p></TooltipContent>
                  </Tooltip>
                </p>
                <p className="text-2xl font-bold">{summaryStats.totalCustomers}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendors */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Active Vendors
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50" /></TooltipTrigger>
                    <TooltipContent><p>कितने सप्लायर अभी चालू हैं</p></TooltipContent>
                  </Tooltip>
                </p>
                <p className="text-2xl font-bold">{summaryStats.totalVendors}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third Row - Financial Health */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Receivables */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Customers Se Lena Hai
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50" /></TooltipTrigger>
                    <TooltipContent><p>ग्राहकों से कुल कितना पैसा आना बाकी है</p></TooltipContent>
                  </Tooltip>
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summaryStats.totalReceivables)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  सभी ग्राहकों का कुल बकाया
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Payables */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Vendors Ko Dena Hai
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50" /></TooltipTrigger>
                    <TooltipContent><p>सप्लायर को कुल कितना पैसा देना बाकी है</p></TooltipContent>
                  </Tooltip>
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summaryStats.totalPayables)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  जो खरीदारी का पैसा अभी बाकी है
                </p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        {/* Total Purchase */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Total Purchase
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50" /></TooltipTrigger>
                    <TooltipContent><p>अब तक की कुल खरीदारी की कीमत</p></TooltipContent>
                  </Tooltip>
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(dashboardData.metrics.totalPurchase.total)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  कुल खरीदारी की रकम
                </p>
              </div>
              <ShoppingBag className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Avg. Bill Value
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50" /></TooltipTrigger>
                    <TooltipContent><p>एक बिल की औसत कितनी रकम होती है</p></TooltipContent>
                  </Tooltip>
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(summaryStats.averageOrderValue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  हर बिल का औसत
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fourth Row - Inventory Status */}
      <div className="grid gap-6">
        <Card>
          <div className="p-6 w-full">
            <h3 className="text-base font-medium text-gray-900 mb-4">
              Inventory Status
            </h3>
            <InventoryStatus stats={inventoryData.stats} />
          </div>
        </Card>
      </div>

      {/* Fifth Row - Top Selling Items & Revenue Chart */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Top Selling Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            {topSellingItems && topSellingItems.length > 0 ? (
              <div className="space-y-3">
                {topSellingItems.map((item, index) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.totalQuantity.toFixed(2)} units sold
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-sm">
                      {formatCurrency(item.totalValue)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mb-2 opacity-50" />
                <p>No sales data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue vs Costs */}
        <Card>
          <div className="p-6">
            <RevenueSummary data={dashboardData.monthlyData} />
          </div>
        </Card>
      </div>
    </div>
    </TooltipProvider>
  );
}

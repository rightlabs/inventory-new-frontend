import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle, BarChart3, TrendingUp } from "lucide-react";

export function InventoryStats({ stats }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-purple-500" />
            <p className="text-sm font-medium text-[#64748B]">Total Items</p>
          </div>
          <h3 className="text-2xl font-semibold text-[#1E293B] mt-2">
            {stats.totalItems}
          </h3>
        </CardContent>
      </Card>

      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="text-sm font-medium text-[#64748B]">
              Low Stock Items
            </p>
          </div>
          <h3 className="text-2xl font-semibold text-[#1E293B] mt-2">
            {stats.lowStockItems}
          </h3>
        </CardContent>
      </Card>

      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-green-500" />
            <p className="text-sm font-medium text-[#64748B]">Categories</p>
          </div>
          <h3 className="text-2xl font-semibold text-[#1E293B] mt-2">
            {stats.valueByCategory.length}
          </h3>
        </CardContent>
      </Card>

      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <p className="text-sm font-medium text-[#64748B]">Total Value</p>
          </div>
          <h3 className="text-2xl font-semibold text-[#1E293B] mt-2">
            ₹
            {stats.valueByCategory
              .reduce((acc, cat) => acc + cat.totalValue, 0)
              .toLocaleString()}
          </h3>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export function StatsCards() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#64748B]">Gross Sales</p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-semibold text-[#1E293B]">₹22,892</h3>
              <div className="flex items-center text-[#16A34A] text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>26%</span>
                <span className="text-[#64748B] ml-1">+1.42k today</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#64748B]">Average Sales</p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-semibold text-[#1E293B]">₹8,283</h3>
              <div className="flex items-center text-[#16A34A] text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>23%</span>
                <span className="text-[#64748B] ml-1">+0.34k today</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#64748B]">New Sales</p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-semibold text-[#1E293B]">₹1,853</h3>
              <div className="flex items-center text-[#DC2626] text-sm">
                <TrendingDown className="w-4 h-4 mr-1" />
                <span>2.4%</span>
                <span className="text-[#64748B] ml-1">+0.45 today</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#64748B]">Gross Profits</p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-semibold text-[#1E293B]">₹5,239</h3>
              <div className="flex items-center text-[#16A34A] text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>14.4%</span>
                <span className="text-[#64748B] ml-1">+0.5k today</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

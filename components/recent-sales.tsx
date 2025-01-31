"use client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RecentSale {
  name: string;
  email: string;
  amount: string;
  status: string;
}

interface RecentSalesProps {
  sales: RecentSale[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  if (!sales || sales.length === 0) {
    return <div>No recent sales</div>;
  }

  return (
    <div className="space-y-8 mt-4">
      {sales.map((sale, index) => (
        <div key={`${sale.name}-${index}`} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {sale.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.name}</p>
            <p className="text-sm text-muted-foreground">{sale.email}</p>
          </div>
          <div className="ml-auto font-medium">
            <div className="flex flex-col items-end">
              <span>{sale.amount}</span>
              <span
                className={`text-xs ${
                  sale.status === "delivered"
                    ? "text-green-500"
                    : sale.status === "pending"
                    ? "text-yellow-500"
                    : "text-blue-500"
                }`}
              >
                {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

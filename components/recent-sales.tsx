"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const recentSales = [
  {
    name: "Rajesh Kumar",
    email: "rajesh@example.com",
    amount: "₹45,000",
    status: "completed",
  },
  {
    name: "Priya Sharma",
    email: "priya@example.com",
    amount: "₹78,500",
    status: "pending",
  },
  {
    name: "Amit Patel",
    email: "amit@example.com",
    amount: "₹23,900",
    status: "completed",
  },
  {
    name: "Sneha Verma",
    email: "sneha@example.com",
    amount: "₹92,000",
    status: "processing",
  },
  {
    name: "Vikram Singh",
    email: "vikram@example.com",
    amount: "₹17,500",
    status: "completed",
  },
];

export function RecentSales() {
  return (
    <div className="space-y-8 mt-4">
      {recentSales.map((sale) => (
        <div key={sale.email} className="flex items-center">
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
                  sale.status === "completed"
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

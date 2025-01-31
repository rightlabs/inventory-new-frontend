// components/dashboard/RecentActivity.tsx
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function RecentActivity({ sales, inventoryTransactions }) {
  // Combine and sort both types of activities
  const allActivities = [
    ...sales.map((sale) => ({
      ...sale,
      type: "sale",
      date: new Date(sale.date),
    })),
    ...inventoryTransactions.map((transaction) => ({
      id: transaction._id,
      name: transaction.item.name,
      quantity: transaction.quantity,
      type: "inventory",
      status: transaction.type,
      date: new Date(transaction.date),
      documentNumber: transaction.documentNumber,
    })),
  ].sort((a, b) => b.date - a.date);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-600">Recent Activity</h4>
      <div className="space-y-4">
        {allActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
          >
            {activity.type === "sale" ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      {activity.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{activity.name}</p>
                    <p className="text-xs text-gray-500">
                      {activity.date.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{activity.amount}</p>
                  <p
                    className={`text-xs ${
                      activity.status === "delivered"
                        ? "text-green-500"
                        : activity.status === "pending"
                        ? "text-yellow-500"
                        : "text-blue-500"
                    }`}
                  >
                    {activity.status}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium">{activity.name}</p>
                  <p className="text-xs text-gray-500">
                    {activity.date.toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium ${
                      activity.status === "in"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {activity.status === "in" ? "+" : "-"}
                    {activity.quantity}
                  </p>
                  <p className="text-xs text-gray-500">
                    #{activity.documentNumber}
                  </p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

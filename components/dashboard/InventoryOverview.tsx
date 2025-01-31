// components/dashboard/InventoryOverview.tsx
export function InventoryOverview({ categories, transactions }) {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-4">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M14 0H2C0.9 0 0 0.9 0 2V14C0 15.1 0.9 16 2 16H14C15.1 16 16 15.1 16 14V2C16 0.9 15.1 0 14 0ZM2 14V2H14V14H2Z"
                fill="#7C3AED"
              />
              <path
                d="M4 8H6V12H4V8ZM7 4H9V12H7V4ZM10 6H12V12H10V6Z"
                fill="#7C3AED"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-700">
            Category Overview
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {categories.map((category) => (
            <div
              key={category._id}
              className="flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-gray-900">{category._id}</p>
                <p className="text-sm text-gray-500">
                  {category.itemCount} items
                </p>
              </div>
              <p className="text-sm text-gray-900">
                ₹{category.totalValue.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction._id}
              className="flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {transaction.item.name}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(transaction.date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-red-600">
                  {transaction.type === "in" ? "+" : "-"}
                  {transaction.quantity}
                </p>
                <p className="text-xs text-gray-500">
                  Sale #{transaction.documentNumber}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

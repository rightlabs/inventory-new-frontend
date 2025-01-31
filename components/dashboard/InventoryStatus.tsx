// components/dashboard/InventoryStatus.tsx
export function InventoryStatus({ stats }) {
  return (
    <div className="space-y-4">
      <div className="bg-[#F3E8FF] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-4 text-purple-500">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 0C3.13438 0 0 3.13438 0 7C0 10.8656 3.13438 14 7 14C10.8656 14 14 10.8656 14 7C14 3.13438 10.8656 0 7 0ZM7 12.8333C3.78125 12.8333 1.16667 10.2188 1.16667 7C1.16667 3.78125 3.78125 1.16667 7 1.16667C10.2188 1.16667 12.8333 3.78125 12.8333 7C12.8333 10.2188 10.2188 12.8333 7 12.8333Z"
                fill="#7C3AED"
              />
            </svg>
          </div>
          <span className="text-sm text-purple-700">Total Items</span>
        </div>
        <p className="text-4xl font-bold text-purple-900">{stats.totalItems}</p>
      </div>

      <div className="bg-[#FEE2E2] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-4 text-red-500">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8.4 0L16 13.6H0.8L8.4 0ZM8.4 2.4L2.4 12.8H14.4L8.4 2.4ZM7.6 6V9.2H9.2V6H7.6ZM7.6 10.4V12H9.2V10.4H7.6Z"
                fill="#DC2626"
              />
            </svg>
          </div>
          <span className="text-sm text-red-700">Low Stock</span>
        </div>
        <p className="text-4xl font-bold text-red-900">{stats.lowStockItems}</p>
      </div>

      <div className="bg-[#DBEAFE] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-4 text-blue-500">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM8 14.4C4.472 14.4 1.6 11.528 1.6 8C1.6 4.472 4.472 1.6 8 1.6C11.528 1.6 14.4 4.472 14.4 8C14.4 11.528 11.528 14.4 8 14.4Z"
                fill="#3B82F6"
              />
              <path
                d="M8.8 4H7.2V8.4L11 10.8L11.8 9.544L8.8 7.6V4Z"
                fill="#3B82F6"
              />
            </svg>
          </div>
          <span className="text-sm text-blue-700">Total Value</span>
        </div>
        <p className="text-4xl font-bold text-blue-900">
          ₹
          {stats.valueByCategory
            .reduce((acc, cat) => acc + cat.totalValue, 0)
            .toLocaleString()}
        </p>
      </div>
    </div>
  );
}

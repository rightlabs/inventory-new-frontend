import React, { useState, useMemo, useRef, useEffect, KeyboardEvent } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { InventoryItem } from "@/types/type";
import { Search, Package, AlertCircle } from "lucide-react";

interface ItemSelectionProps {
  item: any;
  index: number;
  items: InventoryItem[];
  onItemChange: (index: number, item: any) => void;
  quantityErrors: { [key: number]: { hasError: boolean; message: string } };
}

// Type categories for selection
const ITEM_CATEGORIES = [
  { value: "pipe", label: "Pipe" },
  { value: "sheet", label: "Sheet" },
  { value: "fitting", label: "Fitting" },
  { value: "polish", label: "Polish" },
];

// Helper function to sanitize numeric input - only allows digits and decimal point
const sanitizeNumericInput = (value: string): string => {
  let sanitized = value.replace(/[^0-9.]/g, '');
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  return sanitized;
};

// Helper to prevent invalid key presses in number inputs
const handleNumericKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
  if (
    e.key === 'Backspace' ||
    e.key === 'Delete' ||
    e.key === 'Tab' ||
    e.key === 'Escape' ||
    e.key === 'Enter' ||
    e.key === '.' ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    e.key === 'Home' ||
    e.key === 'End'
  ) {
    return;
  }
  if (e.ctrlKey || e.metaKey) {
    return;
  }
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
};

export default function ItemSelection({
  item,
  index,
  items,
  onItemChange,
  quantityErrors,
}: ItemSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter items by category
  const categoryFilteredItems = useMemo(() => {
    if (!item.type) return [];

    return items.filter((i: any) => {
      if (item.type === "pipe") {
        return i.itemType === "PipeSheet" && i.type === "pipe";
      }
      if (item.type === "sheet") {
        return i.itemType === "PipeSheet" && i.type === "sheet";
      }
      if (item.type === "fitting") {
        return i.itemType === "Fitting";
      }
      if (item.type === "polish") {
        return i.itemType === "Polish";
      }
      return false;
    });
  }, [items, item.type]);

  // Search filtered items - searches across all words
  const searchFilteredItems = useMemo(() => {
    if (!searchQuery.trim()) return categoryFilteredItems;

    const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);

    return categoryFilteredItems.filter((product: any) => {
      // Create a searchable string from all relevant fields
      const searchableText = [
        product.name,
        product.code,
        product.grade,
        product.size,
        product.gauge,
        product.subCategory,
        product.specification,
        product.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // All search terms must match somewhere in the searchable text
      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [categoryFilteredItems, searchQuery]);

  // Get selected product details
  const selectedProduct = useMemo(() => {
    return items.find((p: any) => p._id === item.itemId);
  }, [items, item.itemId]);

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setSearchQuery("");
    onItemChange(index, {
      type: value,
      itemId: "",
      name: "",
      grade: "",
      size: "",
      gauge: "",
      subCategory: "",
      specification: "",
      quantity: undefined,
      weight: undefined,
      pieces: undefined,
      rate: 0,
      margin: 0,
      sellingPrice: 0,
      amount: 0,
    });
  };

  // Handle item selection
  const handleItemSelect = (product: any) => {
    setSearchQuery("");
    setIsDropdownOpen(false);

    const initialQuantity = product.unitType === "weight" ? undefined : 1;
    const initialWeight = product.unitType === "weight" ? 0 : undefined;

    onItemChange(index, {
      ...item,
      itemId: product._id,
      name: product.name,
      grade: product.grade || "",
      size: product.size || "",
      gauge: product.gauge || "",
      subCategory: product.subCategory || "",
      specification: product.specification || "",
      rate: product.purchaseRate || 0,
      margin: 0,
      sellingPrice: product.purchaseRate || 0,
      quantity: initialQuantity,
      weight: initialWeight,
      pieces: initialQuantity,
      amount: 0,
    });
  };

  // Handle numeric input - allows empty values
  const handleNumericInput = (
    field: string,
    value: string,
    additionalUpdates?: (numValue: number) => object
  ) => {
    // Allow empty string
    if (value === "" || value === null || value === undefined) {
      onItemChange(index, {
        ...item,
        [field]: "",
        ...(additionalUpdates ? additionalUpdates(0) : {}),
      });
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    onItemChange(index, {
      ...item,
      [field]: numValue,
      ...(additionalUpdates ? additionalUpdates(numValue) : {}),
    });
  };

  // Calculate selling price and amount
  const calculatePrices = (rate: number, margin: number, qty: number) => {
    const sellingPrice = rate + margin;
    const amount = qty * sellingPrice;
    return { sellingPrice, amount };
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get item display info
  const getItemDisplayInfo = (product: any) => {
    const parts = [product.name];
    const stock = product.currentStock;
    const unit = product.unitType === "weight" ? "kg" : "pcs";
    return {
      name: parts.join(" "),
      stock: `${stock} ${unit}`,
      purchaseRate: product.purchaseRate || 0,
      avgRate: product.averageRate || product.purchaseRate || 0,
    };
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Category and Product Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Selector */}
        <div>
          <label className="text-sm font-medium mb-1 block">Category*</label>
          <Select value={item.type || ""} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {ITEM_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Searchable Product Selector */}
        {item.type && (
          <div className="relative" ref={dropdownRef}>
            <label className="text-sm font-medium mb-1 block">Product*</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                value={item.itemId ? selectedProduct?.name || "" : searchQuery}
                onChange={(e) => {
                  if (item.itemId) {
                    // Clear selection and start new search
                    onItemChange(index, { ...item, itemId: "", name: "" });
                  }
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => {
                  setIsDropdownOpen(true);
                  if (item.itemId) {
                    setSearchQuery("");
                  }
                }}
                className="pl-9"
              />
            </div>

            {/* Dropdown Results */}
            {isDropdownOpen && !item.itemId && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto">
                {searchFilteredItems.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    {searchQuery ? "No products found" : "Start typing to search"}
                  </div>
                ) : (
                  searchFilteredItems.map((product: any) => {
                    const info = getItemDisplayInfo(product);
                    const isLowStock = product.currentStock < product.minimumStock;

                    return (
                      <div
                        key={product._id}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => handleItemSelect(product)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{info.name}</p>
                            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                              <span className={isLowStock ? "text-red-500 font-medium" : ""}>
                                Stock: {info.stock}
                              </span>
                              <span>Rate: {formatCurrency(info.purchaseRate)}</span>
                              <span>Avg: {formatCurrency(info.avgRate)}</span>
                            </div>
                          </div>
                          {isLowStock && (
                            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Row 2: Product Details (read-only, auto-filled) */}
      {selectedProduct && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
            {/* Show relevant attributes based on category */}
            {(item.type === "pipe" || item.type === "sheet") && (
              <>
                <div>
                  <span className="text-xs text-muted-foreground">Grade</span>
                  <p className="font-medium text-sm">{(selectedProduct as any).grade || "-"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Size</span>
                  <p className="font-medium text-sm">{(selectedProduct as any).size || "-"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Gauge</span>
                  <p className="font-medium text-sm">{(selectedProduct as any).gauge || "-"}</p>
                </div>
              </>
            )}
            {item.type === "fitting" && (
              <>
                <div>
                  <span className="text-xs text-muted-foreground">Category</span>
                  <p className="font-medium text-sm">{(selectedProduct as any).subCategory?.replace(/_/g, " ") || "-"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Grade</span>
                  <p className="font-medium text-sm">{(selectedProduct as any).grade || "-"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Size</span>
                  <p className="font-medium text-sm">{(selectedProduct as any).size || "-"}</p>
                </div>
              </>
            )}
            {item.type === "polish" && (
              <>
                <div>
                  <span className="text-xs text-muted-foreground">Type</span>
                  <p className="font-medium text-sm">{(selectedProduct as any).type || "-"}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Specification</span>
                  <p className="font-medium text-sm">{(selectedProduct as any).specification || "-"}</p>
                </div>
              </>
            )}
            <div>
              <span className="text-xs text-muted-foreground">In Stock</span>
              <p className={`font-medium text-sm ${selectedProduct.currentStock < selectedProduct.minimumStock ? "text-red-500" : "text-green-600"}`}>
                {selectedProduct.currentStock} {selectedProduct.unitType === "weight" ? "kg" : "pcs"}
              </p>
            </div>
          </div>

          {/* Row 3: Quantity/Weight and Rate */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Weight or Quantity */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                {selectedProduct.unitType === "weight" ? "Weight (kg)*" : "Quantity*"}
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={selectedProduct.unitType === "weight" ? (item.weight ?? "") : (item.quantity ?? "")}
                onChange={(e) => {
                  const field = selectedProduct.unitType === "weight" ? "weight" : "quantity";
                  const value = sanitizeNumericInput(e.target.value);

                  if (value === "") {
                    onItemChange(index, {
                      ...item,
                      [field]: "",
                      pieces: field === "quantity" ? "" : item.pieces,
                      amount: 0,
                    });
                    return;
                  }

                  const numValue = parseFloat(value);
                  if (isNaN(numValue)) return;

                  const { sellingPrice, amount } = calculatePrices(
                    item.rate || 0,
                    item.margin || 0,
                    numValue
                  );

                  onItemChange(index, {
                    ...item,
                    [field]: numValue,
                    pieces: field === "quantity" ? numValue : item.pieces,
                    sellingPrice,
                    amount,
                  });
                }}
                onKeyDown={handleNumericKeyDown}
                placeholder={`Enter ${selectedProduct.unitType === "weight" ? "weight" : "quantity"}`}
              />
              {quantityErrors[index]?.hasError && (
                <p className="text-red-500 text-xs mt-1">{quantityErrors[index].message}</p>
              )}
            </div>

            {/* Purchase Rate with info */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Purchase Rate
                <span className="text-xs text-muted-foreground ml-1">
                  (Avg: {formatCurrency(selectedProduct.averageRate || selectedProduct.purchaseRate || 0)})
                </span>
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={item.rate ?? ""}
                onChange={(e) => {
                  const value = sanitizeNumericInput(e.target.value);
                  if (value === "") {
                    onItemChange(index, { ...item, rate: "", sellingPrice: item.margin || 0, amount: 0 });
                    return;
                  }
                  const rate = parseFloat(value);
                  if (isNaN(rate)) return;

                  const qty = selectedProduct.unitType === "weight" ? (item.weight || 0) : (item.quantity || 0);
                  const { sellingPrice, amount } = calculatePrices(rate, item.margin || 0, qty);

                  onItemChange(index, { ...item, rate, sellingPrice, amount });
                }}
                onKeyDown={handleNumericKeyDown}
                placeholder="Enter rate"
              />
            </div>

            {/* Margin */}
            <div>
              <label className="text-sm font-medium mb-1 block">Margin (₹)</label>
              <Input
                type="text"
                inputMode="decimal"
                value={item.margin ?? ""}
                onChange={(e) => {
                  const value = sanitizeNumericInput(e.target.value);
                  if (value === "") {
                    const qty = selectedProduct.unitType === "weight" ? (item.weight || 0) : (item.quantity || 0);
                    onItemChange(index, {
                      ...item,
                      margin: "",
                      sellingPrice: item.rate || 0,
                      amount: qty * (item.rate || 0),
                    });
                    return;
                  }
                  const margin = parseFloat(value);
                  if (isNaN(margin)) return;

                  const qty = selectedProduct.unitType === "weight" ? (item.weight || 0) : (item.quantity || 0);
                  const { sellingPrice, amount } = calculatePrices(item.rate || 0, margin, qty);

                  onItemChange(index, { ...item, margin, sellingPrice, amount });
                }}
                onKeyDown={handleNumericKeyDown}
                placeholder="Enter margin"
              />
            </div>

            {/* Selling Price (calculated) */}
            <div>
              <label className="text-sm font-medium mb-1 block">Selling Price</label>
              <Input
                type="number"
                value={(item.sellingPrice || 0).toFixed(2)}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* Row 4: Amount */}
          <div className="flex justify-end">
            <div className="text-right">
              <span className="text-sm text-muted-foreground">Amount: </span>
              <span className="text-lg font-bold">{formatCurrency(item.amount || 0)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import React, { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Type guard functions
const isPipeSheet = (item: any) => item.itemType === "PipeSheet";
const isFitting = (item: any) => item.itemType === "Fitting";
const isPolish = (item: any) => item.itemType === "Polish";

export default function ItemSelection({
  item,
  index,
  items,
  onItemChange,
  quantityErrors,
}: any) {
  // Get filtered options for a specific field based on current selections
  const getFilteredOptions = (field: any) => {
    // Start with all items
    let filteredItems = items;

    // Apply type-specific filters
    if (item.type) {
      filteredItems = items.filter((i: any) => {
        if (item.type === "pipe" || item.type === "sheet") {
          return isPipeSheet(i) && i.type === item.type;
        }
        if (item.type === "fitting") {
          return isFitting(i);
        }
        if (item.type === "polish") {
          return isPolish(i);
        }
        return false;
      });
    }

    // Apply grade filter if selected
    if (item.grade) {
      filteredItems = filteredItems.filter((i: any) => i.grade === item.grade);
    }

    // Apply size filter if selected
    if (item.size) {
      filteredItems = filteredItems.filter((i: any) => i.size === item.size);
    }

    // Apply subcategory filter if selected
    if (item.subCategory) {
      filteredItems = filteredItems.filter(
        (i: any) => i.subCategory === item.subCategory
      );
    }

    // Get unique values for the requested field
    const values = new Set();
    filteredItems.forEach((i: any) => {
      const value = i[field];
      if (value) values.add(value);
    });

    return Array.from(values).sort();
  };

  // Get available products based on all current selections
  const availableProducts = useMemo(() => {
    if (!item.type) return [];

    return items.filter((i: any) => {
      if (item.type === "pipe" || item.type === "sheet") {
        return (
          isPipeSheet(i) &&
          i.type === item.type &&
          (!item.grade || i.grade === item.grade) &&
          (!item.size || i.size === item.size) &&
          (!item.gauge || i.gauge === item.gauge)
        );
      }

      if (item.type === "fitting") {
        return (
          isFitting(i) &&
          (!item.subCategory || i.subCategory === item.subCategory) &&
          (!item.grade || i.grade === item.grade) &&
          (!item.size || i.size === item.size)
        );
      }

      if (item.type === "polish") {
        return (
          isPolish(i) &&
          (!item.subCategory || i.type === item.subCategory) &&
          (!item.specification || i.specification === item.specification)
        );
      }

      return false;
    });
  }, [items, item]);

  const renderPipeSheetFields = () => (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Grade*</label>
        <Select
          value={item.grade || ""}
          onValueChange={(value) => {
            onItemChange(index, {
              ...item,
              grade: value,
              size: undefined,
              gauge: undefined,
              itemId: "",
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select grade" />
          </SelectTrigger>
          <SelectContent>
            {getFilteredOptions("grade").map((grade: any) => (
              <SelectItem key={grade} value={grade}>
                {grade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {item.grade && (
        <div>
          <label className="text-sm font-medium mb-1 block">Size*</label>
          <Select
            value={item.size || ""}
            onValueChange={(value) => {
              onItemChange(index, {
                ...item,
                size: value,
                gauge: undefined,
                itemId: "",
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {getFilteredOptions("size").map((size: any) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {item.size && (
        <div>
          <label className="text-sm font-medium mb-1 block">Gauge*</label>
          <Select
            value={item.gauge || ""}
            onValueChange={(value) => {
              onItemChange(index, {
                ...item,
                gauge: value,
                itemId: "",
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gauge" />
            </SelectTrigger>
            <SelectContent>
              {getFilteredOptions("gauge").map((gauge: any) => (
                <SelectItem key={gauge} value={gauge}>
                  {gauge}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  const renderFittingFields = () => (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Category*</label>
        <Select
          value={item.subCategory || ""}
          onValueChange={(value) => {
            onItemChange(index, {
              ...item,
              subCategory: value,
              grade: undefined,
              size: undefined,
              itemId: "",
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {getFilteredOptions("subCategory").map((category: any) => (
              <SelectItem key={category} value={category}>
                {category.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {item.subCategory && (
        <div>
          <label className="text-sm font-medium mb-1 block">Grade*</label>
          <Select
            value={item.grade || ""}
            onValueChange={(value) => {
              onItemChange(index, {
                ...item,
                grade: value,
                size: undefined,
                itemId: "",
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {getFilteredOptions("grade").map((grade: any) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {item.grade && (
        <div>
          <label className="text-sm font-medium mb-1 block">Size*</label>
          <Select
            value={item.size || ""}
            onValueChange={(value) => {
              onItemChange(index, {
                ...item,
                size: value,
                itemId: "",
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {getFilteredOptions("size").map((size: any) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  const renderPolishFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Type*</label>
        <Select
          value={item.subCategory || ""}
          onValueChange={(value) => {
            onItemChange(index, {
              ...item,
              subCategory: value,
              specification: undefined,
              itemId: "",
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {getFilteredOptions("type").map((type: any) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {item.subCategory && (
        <div>
          <label className="text-sm font-medium mb-1 block">
            Specification*
          </label>
          <Select
            value={item.specification || ""}
            onValueChange={(value) => {
              onItemChange(index, {
                ...item,
                specification: value,
                itemId: "",
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select specification" />
            </SelectTrigger>
            <SelectContent>
              {getFilteredOptions("specification").map((spec: any) => (
                <SelectItem key={spec} value={spec}>
                  {spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  const renderTypeSpecificFields = () => {
    switch (item.type) {
      case "pipe":
      case "sheet":
        return renderPipeSheetFields();
      case "fitting":
        return renderFittingFields();
      case "polish":
        return renderPolishFields();
      default:
        return null;
    }
  };

  const renderQuantityField = () => {
    const selectedProduct = items.find((p: any) => p._id === item.itemId);
    if (!selectedProduct) return null;

    if (selectedProduct.unitType === "weight") {
      return (
        <div>
          <label className="text-sm font-medium mb-1 block">Weight (kg)*</label>
          <Input
            type="number"
            value={item.weight || ""}
            onChange={(e) => {
              const weight = Number(e.target.value);
              onItemChange(index, {
                ...item,
                weight,
                quantity: undefined,
                amount: weight * (item.sellingPrice || 0),
                gstAmount: (weight * (item.sellingPrice || 0) * item.gst) / 100,
              });
            }}
            min="0"
            step="0.01"
            placeholder="Enter weight"
          />
          {quantityErrors[index]?.hasError && (
            <p className="text-red-500 text-xs mt-1">
              {quantityErrors[index].message}
            </p>
          )}
        </div>
      );
    }

    return (
      <div>
        <label className="text-sm font-medium mb-1 block">Quantity*</label>
        <Input
          type="number"
          value={item.quantity || ""}
          onChange={(e) => {
            const quantity = Number(e.target.value);
            onItemChange(index, {
              ...item,
              quantity,
              weight: undefined,
              amount: quantity * (item.sellingPrice || 0),
              gstAmount: (quantity * (item.sellingPrice || 0) * item.gst) / 100,
            });
          }}
          min="1"
          step="1"
          placeholder="Enter quantity"
        />
        {quantityErrors[index]?.hasError && (
          <p className="text-red-500 text-xs mt-1">
            {quantityErrors[index].message}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Type*</label>
          <Select
            value={item.type || ""}
            onValueChange={(value) => {
              onItemChange(index, {
                type: value,
                itemId: "",
                name: "",
                grade: undefined,
                size: undefined,
                gauge: undefined,
                subCategory: undefined,
                specification: undefined,
                quantity: undefined,
                weight: undefined,
                rate: 0,
                margin: 0,
                sellingPrice: 0,
                amount: 0,
                gst: 0,
                gstAmount: 0,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pipe">Pipe</SelectItem>
              <SelectItem value="sheet">Sheet</SelectItem>
              <SelectItem value="fitting">Fitting</SelectItem>
              <SelectItem value="polish">Polish</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {availableProducts.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-1 block">Product*</label>
            <Select
              value={item.itemId || ""}
              onValueChange={(value) => {
                const selectedProduct = items.find((p: any) => p._id === value);
                if (selectedProduct) {
                  onItemChange(index, {
                    ...item,
                    itemId: value,
                    name: selectedProduct.name,
                    rate: selectedProduct.purchaseRate,
                    gst: selectedProduct.gst,
                    margin: 0,
                    sellingPrice: selectedProduct.purchaseRate,
                    amount: 0,
                    gstAmount: 0,
                    quantity:
                      selectedProduct.unitType === "weight" ? undefined : 1,
                    weight:
                      selectedProduct.unitType === "weight" ? 0 : undefined,
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map((product: any) => (
                  <SelectItem key={product._id} value={product._id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {item.type && renderTypeSpecificFields()}

      {item.itemId && (
        <div className="grid grid-cols-3 gap-4">
          {renderQuantityField()}

          <div>
            <label className="text-sm font-medium mb-1 block">Margin (%)</label>
            <Input
              type="number"
              value={item.margin || 0}
              onChange={(e) => {
                const margin = Number(e.target.value);
                const sellingPrice = (item.rate || 0) * (1 + margin / 100);
                const quantity = item.weight || item.quantity || 0;
                const amount = quantity * sellingPrice;
                const gstAmount = (amount * item.gst) / 100;

                onItemChange(index, {
                  ...item,
                  margin,
                  sellingPrice,
                  amount,
                  gstAmount,
                });
              }}
              min="0"
              max="100"
              step="0.01"
              placeholder="Enter margin"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Rate</label>
          <Input
            type="number"
            value={item.rate || 0}
            onChange={(e) => {
              const rate = Number(e.target.value);
              const sellingPrice = rate * (1 + (item.margin || 0) / 100);
              const quantity = item.weight || item.quantity || 0;
              const amount = quantity * sellingPrice;
              const gstAmount = (amount * item.gst) / 100;

              onItemChange(index, {
                ...item,
                rate,
                sellingPrice,
                amount,
                gstAmount,
              });
            }}
            min="0"
            step="0.01"
            placeholder="Enter rate"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">GST (%)</label>
          <Input
            type="number"
            value={item.gst || 0}
            onChange={(e) => {
              const gst = Number(e.target.value);
              const quantity = item.weight || item.quantity || 0;
              const amount = quantity * (item.sellingPrice || 0);
              const gstAmount = (amount * gst) / 100;

              onItemChange(index, {
                ...item,
                gst,
                gstAmount,
              });
            }}
            min="0"
            max="100"
            step="0.01"
            placeholder="Enter GST"
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InventoryItem,
  ItemType,
  PipeSheetItem,
  FittingItem,
  PolishItem,
  SaleItem,
} from "@/types/type";
import { toast } from "react-hot-toast";

interface ItemFormProps {
  initialData?: InventoryItem | null;
  onSubmit: (data: Partial<InventoryItem>) => Promise<void>;
  onCancel: () => void;
}

export interface ItemSelectionProps {
  item: SaleItem;
  index: number;
  items: InventoryItem[];
  onItemChange: (index: number, updatedItem: Partial<SaleItem>) => void;
  quantityErrors: {
    [key: number]: {
      hasError: boolean;
      message: string;
    };
  };
}

interface ItemFormData {
  itemType: ItemType;
  name: string;
  code: string;
  currentStock: number | string;
  minimumStock: number | string;
  purchaseRate: number | string;
  sellingRate: number | string;
  margin: number | string;
  unitType: "weight" | "pieces";
  // Type specific fields
  type: string;
  grade: string | "304" | "202";
  size: string;
  gauge: string;
  weight: number | string;
  subCategory: string;
  specification: string;
  variant: string;
}

export default function ItemForm({
  initialData,
  onSubmit,
  onCancel,
}: ItemFormProps | any) {
  const [itemType, setItemType] = useState<ItemType | any>(
    initialData?.itemType || "PipeSheet"
  );

  const [formData, setFormData] = useState<ItemFormData>({
    itemType,
    name: initialData?.name || "",
    code: initialData?.code || "",
    currentStock: initialData?.currentStock ?? "",
    minimumStock: initialData?.minimumStock ?? "",
    purchaseRate: initialData?.purchaseRate ?? "",
    sellingRate: initialData?.sellingRate ?? "",
    margin: initialData?.margin ?? "",
    unitType: initialData?.unitType || "pieces",
    // Type specific fields
    type: initialData?.type || "",
    grade: (initialData as any)?.grade || "304",
    size: initialData?.size || "",
    gauge: (initialData as any)?.gauge || "",
    weight: (initialData as any)?.weight ?? "",
    subCategory: (initialData as any)?.subCategory || "",
    specification: (initialData as any)?.specification || "",
    variant: (initialData as any)?.variant || null,
  });

  const isPipeSheetData = (data: any): data is Omit<PipeSheetItem, "_id"> => {
    return data.itemType === "PipeSheet";
  };

  const isFittingData = (data: any): data is Omit<FittingItem, "_id"> => {
    return data.itemType === "Fitting";
  };

  const isPolishData = (data: any): data is Omit<PolishItem, "_id"> => {
    return data.itemType === "Polish";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        itemType,
      };

      if (
        isPipeSheetData(submitData) ||
        isFittingData(submitData) ||
        isPolishData(submitData)
      ) {
        await onSubmit(submitData);
      } else {
        throw new Error("Invalid item type");
      }
    } catch (error) {
      toast.error("Failed to save item");
    }
  };

  const renderTypeSpecificFields = () => {
    switch (itemType) {
      case "PipeSheet":
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={formData.type}
                disabled
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pipe">Pipe</SelectItem>
                  <SelectItem value="sheet">Sheet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Grade</label>
              <Select
                value={formData.grade}
                disabled
                onValueChange={(value) =>
                  setFormData({ ...formData, grade: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="304">304</SelectItem>
                  <SelectItem value="202">202</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Size</label>
              <Input
                disabled
                value={formData.size}
                onChange={(e) =>
                  setFormData({ ...formData, size: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gauge</label>
              <Input
                disabled
                value={formData.gauge}
                onChange={(e) =>
                  setFormData({ ...formData, gauge: e.target.value })
                }
              />
            </div>
          </>
        );

      case "Fitting":
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subcategory</label>
              <Select
                value={formData.subCategory}
                disabled
                onValueChange={(value) =>
                  setFormData({ ...formData, subCategory: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {FITTING_SUBCATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Size</label>
              <Input
                disabled
                value={formData.size}
                onChange={(e) =>
                  setFormData({ ...formData, size: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Grade</label>
              <Select
                value={formData.grade}
                disabled
                onValueChange={(value) =>
                  setFormData({ ...formData, grade: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="304">304</SelectItem>
                  <SelectItem value="202">202</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Input
                disabled
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, size: e.target.value })
                }
              />
            </div>
          </>
        );

      case "Polish":
        return (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Input
                value={formData.type}
                disabled
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Specification</label>
              <Input
                value={formData.specification}
                disabled
                onChange={(e) =>
                  setFormData({ ...formData, specification: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Variant</label>
              <Select
                value={formData.variant || ""}
                disabled
                onValueChange={(value) =>
                  setFormData({ ...formData, variant: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="One Side">One Side</SelectItem>
                  <SelectItem value="Two Side">Two Side</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Item Type</label>
        <Select value={itemType} onValueChange={setItemType} disabled={true}>
          <SelectTrigger>
            <SelectValue placeholder="Select item type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PipeSheet">Pipe/Sheet</SelectItem>
            <SelectItem value="Fitting">Fitting</SelectItem>
            <SelectItem value="Polish">Polish</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Code</label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            disabled
          />
        </div>

        {renderTypeSpecificFields()}

        <div className="space-y-2">
          <label className="text-sm font-medium">Current Stock</label>
          <Input
            type="number"
            value={formData.currentStock}
            onChange={(e) =>
              setFormData({ ...formData, currentStock: e.target.value })
            }
            placeholder="Enter stock"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Minimum Stock</label>
          <Input
            type="number"
            value={formData.minimumStock}
            onChange={(e) =>
              setFormData({ ...formData, minimumStock: e.target.value })
            }
            placeholder="Enter minimum stock"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Purchase Rate</label>
          <Input
            type="number"
            value={formData.purchaseRate}
            onChange={(e) =>
              setFormData({ ...formData, purchaseRate: e.target.value })
            }
            placeholder="Enter rate"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Selling Rate</label>
          <Input
            type="number"
            value={formData.sellingRate}
            onChange={(e) =>
              setFormData({
                ...formData,
                sellingRate: e.target.value,
              })
            }
            placeholder="Enter selling rate"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? "Update Item" : "Create Item"}
        </Button>
      </div>
    </form>
  );
}

const FITTING_SUBCATEGORIES = [
  "ball",
  "ball_with_nut",
  "base",
  "thali_base",
  "cap",
  "bush",
  "l_drop",
  "stopper",
  "d_lock",
  "hinges",
  "balustred_cap",
  "baluster",
  "master_pillar",
  "starwindow",
  "butterfly",
  "gamla",
  "step",
  "baind",
  "star_ring",
  "ring",
  "bhala",
  "braket",
  "ground_braket",
  "om",
  "swastik",
  "shubh_labh",
  "mel_femel_nut",
  "flower",
  "bail",
  "gate_wheel",
  "gate_opener",
];

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
import { InventoryItem, ItemType } from "@/api/items";
import { toast } from "react-hot-toast";

interface ItemFormProps {
  initialData?: InventoryItem | null;
  onSubmit: (data: Partial<InventoryItem>) => Promise<void>;
  onCancel: () => void;
}

export default function ItemForm({
  initialData,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  const [itemType, setItemType] = useState<ItemType>(
    initialData?.itemType || "PipeSheet"
  );

  const [formData, setFormData] = useState({
    itemType,
    name: initialData?.name || "",
    code: initialData?.code || "",
    currentStock: initialData?.currentStock || 0,
    minimumStock: initialData?.minimumStock || 0,
    purchaseRate: initialData?.purchaseRate || 0,
    sellingRate: initialData?.sellingRate || 0,
    margin: initialData?.margin || 0,
    gst: initialData?.gst || 0,
    unitType: initialData?.unitType || "pieces",
    // Type specific fields
    type: initialData?.type || "",
    grade: (initialData as any)?.grade || "304",
    size: initialData?.size || "",
    gauge: (initialData as any)?.gauge || "",
    weight: (initialData as any)?.weight || 0,
    subCategory: (initialData as any)?.subCategory || "",
    specification: (initialData as any)?.specification || "",
    variant: (initialData as any)?.variant || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        itemType, // Ensure itemType is included
      };
      await onSubmit(submitData);
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
              setFormData({ ...formData, currentStock: Number(e.target.value) })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Minimum Stock</label>
          <Input
            type="number"
            value={formData.minimumStock}
            onChange={(e) =>
              setFormData({ ...formData, minimumStock: Number(e.target.value) })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Purchase Rate</label>
          <Input
            type="number"
            value={formData.purchaseRate}
            onChange={(e) =>
              setFormData({ ...formData, purchaseRate: Number(e.target.value) })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Selling Rate</label>
          <Input
            type="number"
            value={Number(formData.sellingRate)
              .toFixed(2)
              .replace(/[.,]00$/, "")}
            onChange={(e) =>
              setFormData({
                ...formData,
                sellingRate: Number(e.target.value),
              })
            }
            required
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

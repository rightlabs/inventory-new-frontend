"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Download,
  Search,
  AlertCircle,
  Edit2,
  History,
  Package,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// TypeScript interfaces
interface BaseItem {
  id: string;
  name: string;
  inStock: number;
  minimumStock: number;
  lastPurchaseRate?: number;
  lastPurchaseDate?: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

interface PipeItem extends BaseItem {
  type: "pipe";
  grade: "304" | "202";
  size: string;
  gauge: string;
  weight: string;
}

interface SheetItem extends BaseItem {
  type: "sheet";
  grade: "304" | "202";
  size: string;
  gauge: string;
  weight: string;
}

interface FittingItem extends BaseItem {
  type: "fitting";
  category: string; // Ball, Base, Cap, etc.
  size: string;
  variant?: string; // With Nut, Two Pin, etc.
  material: string;
}

interface PolishItem extends BaseItem {
  type: "polish";
  category: string; // Flap Disc, Core Bit, etc.
  specification: string; // 60 nu., 75mm, etc.
  variant?: string; // One Side, Two Side, etc.
}

type InventoryItem = PipeItem | SheetItem | FittingItem | PolishItem;

export default function ItemsPage() {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Sample data
  const pipeItems: PipeItem[] = [
    {
      id: "P001",
      type: "pipe",
      name: "SS Pipe 80x80",
      grade: "304",
      size: "80x80",
      gauge: "14",
      weight: "226.00",
      inStock: 250,
      minimumStock: 100,
      lastPurchaseRate: 244.36,
      lastPurchaseDate: "2024-03-15",
      status: "in_stock",
    },
    {
      id: "P002",
      type: "pipe",
      name: "SS Pipe 50x50",
      grade: "202",
      size: "50x50",
      gauge: "16",
      weight: "150.00",
      inStock: 50,
      minimumStock: 100,
      lastPurchaseRate: 170.36,
      lastPurchaseDate: "2024-03-10",
      status: "low_stock",
    },
  ];

  const sheetItems: SheetItem[] = [
    {
      id: "S001",
      type: "sheet",
      name: "SS Sheet 8x4",
      grade: "304",
      size: "8x4",
      gauge: "14",
      weight: "450.00",
      inStock: 150,
      minimumStock: 50,
      lastPurchaseRate: 350.0,
      lastPurchaseDate: "2024-03-12",
      status: "in_stock",
    },
  ];

  const fittingItems: FittingItem[] = [
    {
      id: "F001",
      type: "fitting",
      name: "Ball with Nut",
      category: "Ball",
      size: "5/8",
      variant: "With Nut",
      material: "SS 304",
      inStock: 500,
      minimumStock: 200,
      lastPurchaseRate: 120.0,
      lastPurchaseDate: "2024-03-14",
      status: "in_stock",
    },
  ];

  const polishItems: PolishItem[] = [
    {
      id: "PL001",
      type: "polish",
      name: "Flap Disc 60",
      category: "Flap Disc",
      specification: "60 nu.",
      variant: "One Side",
      inStock: 1000,
      minimumStock: 500,
      lastPurchaseRate: 45.0,
      lastPurchaseDate: "2024-03-16",
      status: "in_stock",
    },
  ];

  const StatusBadge = ({ status }: { status: InventoryItem["status"] }) => {
    const styles = {
      in_stock: "bg-green-100 text-green-800",
      low_stock: "bg-yellow-100 text-yellow-800",
      out_of_stock: "bg-red-100 text-red-800",
    };

    const labels = {
      in_stock: "In Stock",
      low_stock: "Low Stock",
      out_of_stock: "Out of Stock",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };
  // Form fields based on item type
  const renderTypeSpecificFields = () => {
    switch (selectedType) {
      case "pipe":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Grade*</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="304">304</SelectItem>
                    <SelectItem value="202">202</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Size*</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="80x80">80x80</SelectItem>
                    <SelectItem value="50x50">50x50</SelectItem>
                    <SelectItem value="40x40">40x40</SelectItem>
                    <SelectItem value="25x25">25x25</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Gauge*</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gauge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14">14</SelectItem>
                    <SelectItem value="16">16</SelectItem>
                    <SelectItem value="18">18</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Weight</label>
                <Input type="number" placeholder="Weight in kg" />
              </div>
            </div>
          </>
        );

      case "sheet":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Grade*</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="304">304</SelectItem>
                    <SelectItem value="202">202</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Size*</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8x4">8x4</SelectItem>
                    <SelectItem value="4x4">4x4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Gauge*</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gauge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14">14</SelectItem>
                    <SelectItem value="16">16</SelectItem>
                    <SelectItem value="18">18</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Weight</label>
                <Input type="number" placeholder="Weight in kg" />
              </div>
            </div>
          </>
        );

      case "fitting":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Category*
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ball">Ball</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                    <SelectItem value="cap">Cap</SelectItem>
                    <SelectItem value="bush">Bush</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Size*</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5/8">5/8"</SelectItem>
                    <SelectItem value="3/4">3/4"</SelectItem>
                    <SelectItem value="1">1"</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Variant
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select variant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="with_nut">With Nut</SelectItem>
                    <SelectItem value="two_pin">Two Pin</SelectItem>
                    <SelectItem value="three_pin">Three Pin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Material
                </label>
                <Input placeholder="Enter material" />
              </div>
            </div>
          </>
        );

      case "polish":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Category*
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flap_disc">Flap Disc</SelectItem>
                    <SelectItem value="core_bit">Core Bit</SelectItem>
                    <SelectItem value="cutting_blade">Cutting Blade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Specification*
                </label>
                <Input placeholder="e.g., 60 nu., 75mm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Variant
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select variant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_side">One Side</SelectItem>
                    <SelectItem value="two_side">Two Side</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your inventory items and stock levels
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                Enter item details and initial stock level
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Item Type Selection */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Item Type*
                </label>
                <Select onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pipe">Pipe</SelectItem>
                    <SelectItem value="sheet">Sheet</SelectItem>
                    <SelectItem value="fitting">Fitting</SelectItem>
                    <SelectItem value="polish">Polish Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Type-Specific Fields */}
              {renderTypeSpecificFields()}

              {/* Common Fields */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Initial Stock*
                    </label>
                    <Input type="number" placeholder="Enter quantity" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Minimum Stock Level*
                    </label>
                    <Input type="number" placeholder="Alert below this" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Purchase Rate
                  </label>
                  <Input type="number" placeholder="Rate per unit" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button>Add Item</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search items..."
                className="w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="pipes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipes">Pipes</TabsTrigger>
          <TabsTrigger value="sheets">Sheets</TabsTrigger>
          <TabsTrigger value="fittings">Fittings</TabsTrigger>
          <TabsTrigger value="polish">Polish Items</TabsTrigger>
        </TabsList>

        {/* Pipes Tab */}
        <TabsContent value="pipes">
          <Card>
            <CardHeader>
              <CardTitle>Pipe Items</CardTitle>
              <CardDescription>View and manage pipe inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Grade
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Size
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Gauge
                      </th>
                      <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                        Weight
                      </th>
                      <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                        Stock
                      </th>
                      <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                        Rate
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="h-12 px-4 text-center align-middle text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipeItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 align-middle">{item.name}</td>
                        <td className="p-4 align-middle">{item.grade}</td>
                        <td className="p-4 align-middle">{item.size}</td>
                        <td className="p-4 align-middle">{item.gauge}</td>
                        <td className="p-4 align-middle text-right">
                          {item.weight}
                        </td>
                        <td className="p-4 align-middle text-right">
                          {item.inStock}
                        </td>
                        <td className="p-4 align-middle text-right">
                          ₹{item.lastPurchaseRate?.toFixed(2)}
                        </td>
                        <td className="p-4 align-middle">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex justify-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <History className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sheets Tab */}
        <TabsContent value="sheets">
          <Card>
            <CardHeader>
              <CardTitle>Sheet Items</CardTitle>
              <CardDescription>View and manage sheet inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Grade
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Size
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Gauge
                      </th>
                      <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                        Weight
                      </th>
                      <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                        Stock
                      </th>
                      <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                        Rate
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="h-12 px-4 text-center align-middle text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheetItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 align-middle">{item.name}</td>
                        <td className="p-4 align-middle">{item.grade}</td>
                        <td className="p-4 align-middle">{item.size}</td>
                        <td className="p-4 align-middle">{item.gauge}</td>
                        <td className="p-4 align-middle text-right">
                          {item.weight}
                        </td>
                        <td className="p-4 align-middle text-right">
                          {item.inStock}
                        </td>
                        <td className="p-4 align-middle text-right">
                          ₹{item.lastPurchaseRate?.toFixed(2)}
                        </td>
                        <td className="p-4 align-middle">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex justify-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <History className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Fittings Tab */}
        <TabsContent value="fittings">
          <Card>
            <CardHeader>
              <CardTitle>Fitting Items</CardTitle>
              <CardDescription>
                View and manage fitting inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Size
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Variant
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Material
                      </th>
                      <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                        Stock
                      </th>
                      <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                        Rate
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="h-12 px-4 text-center align-middle text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fittingItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 align-middle">{item.name}</td>
                        <td className="p-4 align-middle">{item.category}</td>
                        <td className="p-4 align-middle">{item.size}</td>
                        <td className="p-4 align-middle">
                          {item.variant || "-"}
                        </td>
                        <td className="p-4 align-middle">{item.material}</td>
                        <td className="p-4 align-middle text-right">
                          {item.inStock}
                        </td>
                        <td className="p-4 align-middle text-right">
                          ₹{item.lastPurchaseRate?.toFixed(2)}
                        </td>
                        <td className="p-4 align-middle">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex justify-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <History className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Polish Items Tab */}
        <TabsContent value="polish">
          <Card>
            <CardHeader>
              <CardTitle>Polish Items</CardTitle>
              <CardDescription>
                View and manage polish items inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Specification
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Variant
                      </th>
                      <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                        Stock
                      </th>
                      <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
                        Rate
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="h-12 px-4 text-center align-middle text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {polishItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 align-middle">{item.name}</td>
                        <td className="p-4 align-middle">{item.category}</td>
                        <td className="p-4 align-middle">
                          {item.specification}
                        </td>
                        <td className="p-4 align-middle">
                          {item.variant || "-"}
                        </td>
                        <td className="p-4 align-middle text-right">
                          {item.inStock}
                        </td>
                        <td className="p-4 align-middle text-right">
                          ₹{item.lastPurchaseRate?.toFixed(2)}
                        </td>
                        <td className="p-4 align-middle">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex justify-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <History className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

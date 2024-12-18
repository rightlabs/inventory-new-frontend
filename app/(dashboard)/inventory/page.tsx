"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Plus, Download, Edit2, Package } from "lucide-react";
import toast from "react-hot-toast";
import {
  getItems,
  createItem,
  updateItem,
  ItemType,
  ItemFilters,
} from "@/api/items";
import ItemForm from "@/components/Forms/ItemForm";

// TypeScript interfaces
interface BaseItem {
  _id: string;
  code: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  purchaseRate: number;
  sellingRate: number;
  margin: number;
  gst: number;
  lastPurchaseDate?: string;
  unitType: "weight" | "pieces";
  status: "in_stock" | "low_stock" | "out_of_stock";
}

interface PipeSheetItem extends BaseItem {
  itemType: "PipeSheet";
  type: "pipe" | "sheet";
  grade: "304" | "202";
  size: string;
  gauge: string;
  weight: number;
  pieces?: number;
}

interface FittingItem extends BaseItem {
  itemType: "Fitting";
  subCategory: string;
  size: string;
  type: "Round" | "Square";
  variant?: "One Side" | "Two Side" | null;
  weight?: number;
}

interface PolishItem extends BaseItem {
  itemType: "Polish";
  type: string;
  subCategory: string;
  specification: string;
  variant?: "One Side" | "Two Side" | null;
}

type InventoryItem = PipeSheetItem | FittingItem | PolishItem;

// Constants
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

const POLISH_SUBCATEGORIES = [
  "Non Woven Pad",
  "Flap Disc",
  "Felt buff Pad",
  "Cutting Blade",
  "Welding Rod",
  "Polish",
  "Grinding Wheel",
  "Core Bit",
].sort();

export default function ItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("pipes");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Implement throttling for search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);

      let filters: ItemFilters = {};

      if (selectedType === "polish") {
        filters = {
          type: "Polish" as ItemType,
          subCategory:
            selectedSubCategory !== "all" ? selectedSubCategory : undefined,
          searchTerm: debouncedSearchTerm,
        };
      } else {
        filters = {
          type:
            selectedType === "fittings"
              ? ("Fitting" as ItemType)
              : ("PipeSheet" as ItemType),
          subCategory:
            selectedSubCategory !== "all" ? selectedSubCategory : undefined,
          searchTerm: debouncedSearchTerm,
        };
      }

      const response = await getItems(filters);

      if (response?.data?.success) {
        const items = response.data.data.map((item: InventoryItem) => ({
          ...item,
          status: getItemStatus(item),
        }));
        setItems(items);
      }
    } catch (error) {
      toast.error("Failed to fetch items");
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedSubCategory, debouncedSearchTerm]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    setSelectedSubCategory("");
  }, [selectedType]);

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="h-24 w-24 mb-4 text-muted-foreground/50">
        <Package className="h-full w-full" />
      </div>
      <h3 className="text-lg font-medium text-muted-foreground mb-2">
        No items found
      </h3>
      <p className="text-sm text-muted-foreground text-center">{message}</p>
    </div>
  );

  const getItemStatus = (item: InventoryItem): BaseItem["status"] => {
    if (item.currentStock === 0) return "out_of_stock";
    if (item.currentStock <= item.minimumStock) return "low_stock";
    return "in_stock";
  };

  const getEmptyStateMessage = () => {
    if (searchTerm) {
      return `No items found matching "${searchTerm}"`;
    }
    if (selectedSubCategory) {
      return `No items found in the "${selectedSubCategory.replace(
        /_/g,
        " "
      )}" category`;
    }
    return `No ${selectedType.slice(0, -1)} items found in inventory`;
  };

  const renderPipeSheetTable = (items: PipeSheetItem[]) => {
    if (!items.length) {
      return <EmptyState message={getEmptyStateMessage()} />;
    }
    return (
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
              Pieces
            </th>
            <th className="h-12 px-4 text-right align-middle text-sm font-medium text-muted-foreground">
              Current Stock
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
          {items.map((item) => (
            <tr
              key={item._id}
              className="border-b transition-colors hover:bg-muted/50"
            >
              <td className="p-4 align-middle">{item.name}</td>
              <td className="p-4 align-middle">{item.grade}</td>
              <td className="p-4 align-middle">{item.size}</td>
              <td className="p-4 align-middle">{item.gauge}</td>
              <td className="p-4 align-middle text-right">{item.pieces}</td>
              <td className="p-4 align-middle text-right">
                {item.currentStock} ({item.unitType})
              </td>
              <td className="p-4 align-middle text-right">
                ₹{item.purchaseRate.toFixed(2)}
              </td>
              <td className="p-4 align-middle">
                <StatusBadge status={item.status} />
              </td>
              <td className="p-4 align-middle">
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedItem(item);
                      setOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderFittingTable = (items: FittingItem[]) => {
    if (!items.length) {
      return <EmptyState message={getEmptyStateMessage()} />;
    }
    return (
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
              Type
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
          {items.map((item) => (
            <tr
              key={item._id}
              className="border-b transition-colors hover:bg-muted/50"
            >
              <td className="p-4 align-middle">{item.name}</td>
              <td className="p-4 align-middle">
                {item?.type?.replace(/_/g, " ")}
              </td>
              <td className="p-4 align-middle">{item.size}</td>
              <td className="p-4 align-middle">{item.type}</td>
              <td className="p-4 align-middle text-right">
                {item.currentStock} ({item?.unitType})
              </td>
              <td className="p-4 align-middle text-right">
                ₹{item.purchaseRate.toFixed(2)}
              </td>
              <td className="p-4 align-middle">
                <StatusBadge status={item.status} />
              </td>
              <td className="p-4 align-middle">
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedItem(item);
                      setOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderPolishTable = (items: PolishItem[]) => {
    if (!items.length) {
      return <EmptyState message={getEmptyStateMessage()} />;
    }
    return (
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
              Name
            </th>
            <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
              Type
            </th>
            <th className="h-12 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
              Specification
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
          {items.map((item) => (
            <tr
              key={item._id}
              className="border-b transition-colors hover:bg-muted/50"
            >
              <td className="p-4 align-middle">{item.name}</td>
              <td className="p-4 align-middle">{item.type}</td>
              <td className="p-4 align-middle">{item.specification}</td>
              <td className="p-4 align-middle text-right">
                {item.currentStock}
              </td>
              <td className="p-4 align-middle text-right">
                ₹{item.purchaseRate.toFixed(2)}
              </td>
              <td className="p-4 align-middle">
                <StatusBadge status={item.status} />
              </td>
              <td className="p-4 align-middle">
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedItem(item);
                      setOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const SubCategoryFilter = () => {
    if (selectedType === "pipes") return null;

    const subcategories =
      selectedType === "fittings"
        ? FITTING_SUBCATEGORIES
        : POLISH_SUBCATEGORIES;
    const placeholder = `Filter ${
      selectedType === "fittings" ? "fitting" : "polish"
    } categories`;

    return (
      <Select
        value={selectedSubCategory}
        onValueChange={setSelectedSubCategory}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {subcategories.map((category) => (
            <SelectItem key={category} value={category}>
              {category.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const StatusBadge = ({ status }: { status: BaseItem["status"] }) => {
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

  const filteredItems = items.filter((item) => {
    // Basic search filter
    const matchesSearch = searchTerm
      ? Object.values(item).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      : true;

    // Type matching
    if (selectedType === "polish" && item.itemType === "Polish") {
      // Check if subcategory is selected
      if (!selectedSubCategory || selectedSubCategory === "all") {
        return true;
      }
      // Direct comparison between item type and selected subcategory
      return (item as PolishItem).type === selectedSubCategory;
    }

    // Handle other types (fittings, pipes, etc.)
    const matchesType =
      selectedType === "polish"
        ? item.itemType === "Polish"
        : selectedType === "fittings"
        ? item.itemType === "Fitting"
        : item.itemType === "PipeSheet";

    return matchesSearch && matchesType;
  });

  const handleSubmit = async (data: Partial<InventoryItem>) => {
    try {
      if (selectedItem) {
        await updateItem(selectedItem._id, data);
        toast.success("Item updated successfully");
      } else {
        await createItem(data as Omit<InventoryItem, "_id">);
        toast.success("Item created successfully");
      }
      setOpen(false);
      fetchItems(); // Refresh the list
    } catch (error) {
      toast.error(
        selectedItem ? "Failed to update item" : "Failed to create item"
      );
    }
  };

  useEffect(() => {
    if (selectedType) {
      setSelectedSubCategory("");
    }
  }, [selectedType]);

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
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setSelectedItem(null);
          }}
        >
          {/* <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </DialogTrigger> */}
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? "Edit Item" : "Add New Item"}
              </DialogTitle>
              <DialogDescription>
                {selectedItem
                  ? "Update item details"
                  : "Enter item details and initial stock level"}
              </DialogDescription>
            </DialogHeader>
            <ItemForm
              initialData={selectedItem}
              onSubmit={handleSubmit}
              onCancel={() => setOpen(false)}
            />
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            {selectedType !== "pipes" && <SubCategoryFilter />}
            {/* <Button variant="outline">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button> */}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList>
          <TabsTrigger value="pipes">Pipes and Sheets</TabsTrigger>
          <TabsTrigger value="fittings">Fittings</TabsTrigger>
          <TabsTrigger value="polish">Polish Items</TabsTrigger>
        </TabsList>

        {/* Pipes Tab */}
        <TabsContent value="pipes">
          <Card>
            <CardHeader>
              <CardTitle>Pipe and Sheet Items</CardTitle>
              <CardDescription>
                View and manage pipe and sheet inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  Loading...
                </div>
              ) : (
                <div className="rounded-md border">
                  {renderPipeSheetTable(filteredItems as PipeSheetItem[])}
                </div>
              )}
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  Loading...
                </div>
              ) : (
                <div className="rounded-md border">
                  {renderPipeSheetTable(filteredItems as PipeSheetItem[])}
                </div>
              )}
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  Loading...
                </div>
              ) : (
                <div className="rounded-md border">
                  {renderFittingTable(filteredItems as FittingItem[])}
                </div>
              )}
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  Loading...
                </div>
              ) : (
                <div className="rounded-md border">
                  {renderPolishTable(
                    // Make sure we're only passing Polish items
                    filteredItems.filter((item) => item.itemType === "Polish")
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

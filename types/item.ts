// types/item.ts
export type ItemType = "PipeSheet" | "Fitting" | "Polish";
export type UnitType = "weight" | "pieces";
export type Grade = "304" | "202";

export interface BaseItemAttributes {
  _id: string;
  code: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  purchaseRate: number;
  sellingRate: number;
  margin: number;
  gst: number;
  unitType: UnitType;
  itemType: ItemType;
}

export interface PipeSheetAttributes extends BaseItemAttributes {
  itemType: "PipeSheet";
  type: "pipe" | "sheet";
  grade: Grade;
  size: string;
  gauge: string;
  weight?: number;
  pieces?: number;
}

export interface FittingAttributes extends BaseItemAttributes {
  itemType: "Fitting";
  subCategory: string;
  size: string;
  grade: Grade;
  type: string;
  variant?: "One Side" | "Two Side" | null;
  weight?: number;
  pieces?: number;
}

export interface PolishAttributes extends BaseItemAttributes {
  itemType: "Polish";
  type: string;
  specification: string;
  variant?: "One Side" | "Two Side" | null;
}

export type InventoryItem =
  | PipeSheetAttributes
  | FittingAttributes
  | PolishAttributes;

export interface SaleItem {
  type: string;
  itemId: string;
  name: string;
  grade?: Grade;
  size?: string;
  gauge?: string;
  subCategory?: string;
  specification?: string;
  quantity?: number;
  weight?: number;
  rate: number;
  margin: number;
  sellingPrice: number;
  amount: number;
  gst: number;
  gstAmount: number;
  itemModel?: ItemType;
}

export interface ItemSelectionProps {
  item: SaleItem;
  index: number;
  items: InventoryItem[];
  onItemChange: (index: number, item: Partial<SaleItem>) => void;
}

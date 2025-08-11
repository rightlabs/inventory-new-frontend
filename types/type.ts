// types/type.ts

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  statusCode: number;
}

// Interface for API responses
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  statusCode: number;
}

// Item Types
export type ItemType = "PipeSheet" | "Fitting" | "Polish";
export type ItemStatus = "in_stock" | "low_stock" | "out_of_stock";
export type UnitType = "weight" | "pieces";

export interface BaseItem {
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
  unitType: UnitType;
  status: ItemStatus;
}

export interface PipeSheetItem extends BaseItem {
  itemType: "PipeSheet";
  type: "pipe" | "sheet";
  grade: "304" | "202";
  size: string;
  gauge: string;
  weight: number;
  pieces?: number;
}

export interface FittingItem extends BaseItem {
  itemType: "Fitting";
  grade: "304" | "202";
  category: string;
  subCategory: string;
  size: string;
  type: "Round" | "Square";
  variant?: "One Side" | "Two Side" | null;
  weight?: number;
}

export interface PolishItem extends BaseItem {
  itemType: "Polish";
  type: string;
  subCategory: string;
  specification: string;
  variant?: "One Side" | "Two Side" | null;
}

export type InventoryItem = PipeSheetItem | FittingItem | PolishItem;

// Transaction Types
export interface Transaction {
  _id: string;
  date: string;
  documentNumber: string;
  type: "debit" | "credit";
  mode: "cash" | "cheque" | "online" | "purchase" | "sale";
  amount: number;
  reference?: string;
  notes?: string;
  balance: number;
}

// Customer Types
export interface Customer {
  _id: string;
  id: string;
  name: string;
  type: "retail" | "wholesale" | "distributor";
  gstin?: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  creditLimit: number;
  currentBalance: number;
  status: "active" | "inactive";
  paymentTerms?: string;
  totalSales: number;
  lastPurchaseDate?: string;
}

// Vendor Types
export interface Vendor {
  _id: string;
  id: string;
  name: string;
  gstin: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  currentBalance: number;
  status: "active" | "inactive";
  paymentTerms?: string;
}

// Sale Types
export interface SaleItem {
  itemId: string;
  itemModel?: ItemType;
  name: string;
  type: string;
  grade?: string;
  size?: string;
  gauge?: string;
  subCategory?: string;
  specification?: string;
  quantity?: number;
  weight?: number;
  pieces?: number; // Added for tracking pieces in sales
  rate: number;
  margin: number; // Absolute margin value in currency (₹), not percentage
  sellingPrice: number;
  amount: number;
  gst: number;
  gstAmount: number;
  variant?: string | null;
}

export interface Sale {
  _id: string;
  saleNumber: string;
  date: string | Date;
  customer: {
    _id: string;
    name: string;
    gstin?: string;
  };
  customerId?: string;
  deliveryAddress?: string;
  items: SaleItem[];
  totalAmount: number;
  discount: number;
  gstAmount: number;
  grandTotal: number;
  balanceAmount: number;
  status: "pending" | "delivered";
  paymentStatus: "unpaid" | "partial" | "paid";
}

// Purchase Types
export interface PurchaseItem {
  itemId: string;
  itemModel: ItemType;
  name: string;
  type: string;
  quantity?: number;
  weight?: number;
  rate: number;
  amount: number;
  gst: number;
  gstAmount: number;
}

export interface Purchase {
  _id: string;
  purchaseNumber: string;
  date: string;
  vendor: {
    _id: string;
    name: string;
    gstin: string;
  };
  items: PurchaseItem[];
  totalAmount: number;
  discount: number;
  gstAmount: number;
  grandTotal: number;
  balanceAmount: number;
  status: "pending" | "received";
  paymentStatus: "unpaid" | "partial" | "paid";
}

// Payment Types
export interface Payment {
  amount: number;
  mode: "cash" | "cheque" | "online";
  reference?: string;
  date: Date;
}

// Dashboard Types
export interface DashboardMetric {
  total: number;
  percentageChange: number;
  todayAmount: number;
}

export interface DashboardMetrics {
  totalSales: DashboardMetric;
  totalPurchase: DashboardMetric;
  grossProfits: DashboardMetric;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  costs: number;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  valueByCategory: {
    _id: string;
    totalValue: number;
    itemCount: number;
  }[];
}

// API Filter Types
export interface BaseFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface SaleFilters extends BaseFilters {
  status?: string;
  paymentStatus?: string;
  customerId?: string;
}

export interface PurchaseFilters extends BaseFilters {
  status?: string;
  paymentStatus?: string;
  vendorId?: string;
}

export interface ItemFilters extends BaseFilters {
  type?: ItemType;
  subCategory?: string;
  searchTerm?: string;
}

// Form Data Types
export interface CustomerFormData {
  businessName: string;
  gstin?: string;
  contactPerson: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  pincode: string;
  creditLimit: number;
  currentBalance?: number;
}

export interface VendorFormData {
  businessName: string;
  gstin: string;
  contactPerson: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  pincode: string;
  creditLimit: number;
  currentBalance?: number;
}

export interface SaleFormData {
  customerId: string;
  date: Date;
  deliveryAddress?: string;
  vehicleNo?: string;
  items: SaleItem[];
  discount: number;
  amountPaid: number;
  paymentMode: "cash" | "cheque" | "online";
  paymentReference?: string;
}

export interface PurchaseFormData {
  vendorId: string;
  date: Date;
  ewayBillNo?: string;
  invoiceNo: string;
  paymentTerms?: string;
  destination?: string;
  vehicleNo?: string;
  freight?: number;
  tcs?: number;
  discount: number;
  amountPaid: number;
  paymentMode: "cash" | "cheque" | "online";
  paymentReference?: string;
  items: PurchaseItem[];
}

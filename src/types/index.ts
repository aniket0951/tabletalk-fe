export interface CreateRestaurantReq {
  name: string;
  phone: string;
  city: string;
  serviceMode: "DINE_IN" | "WALK_IN";
}

export type ServiceMode = "DINE_IN" | "WALK_IN";
export type PlanType = "STARTER" | "GROWTH" | "MULTI";
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "PENDING" | "HALTED" | "CANCELLED" | "COMPLETED" | "PAUSED";
export type MenuItemType = "VEG" | "NON_VEG";
export type TableStatus = "FREE" | "OCCUPIED";
export type OrderStatus = "NEW" | "COOKING" | "READY" | "BILLED" | "SETTLED";
export type InvoiceStatus = "PAID" | "PENDING" | "FAILED" | "REFUNDED";

export interface ApiInvoice {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
  razorpayPaymentId: string | null;
  razorpayInvoiceId: string | null;
  paidAt: string | null;
  paymentMethod: string | null;
  currency: string;
  createdAt: string;
}

export interface CheckoutResponse {
  subscriptionId: string;
  razorpaySubscriptionId: string;
  razorpayKeyId: string;
  amount: number;
  currency: string;
  name: string;
  email: string;
}
export type StaffRole = "WAITER" | "CAPTAIN";

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  veg: boolean;
}

export interface Order {
  id: string;
  orderCode: string;
  table: string;
  phone: string;
  status: OrderStatus;
  time: string;
  placed: string;
  confirmed: string | null;
  cooking: string | null;
  ready: string | null;
  billed: string | null;
  settled: string | null;
  special: string;
  items: OrderItem[];
  total: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: MenuItemType;
  available: boolean;
  category: string;
}

export interface DiningTable {
  id: number;
  label: string;
  capacity: number;
  active: boolean;
  status: TableStatus;
  order: string;
}

export interface PlanInfo {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
}

export interface StatCard {
  label: string;
  value: string;
  delta?: string;
  deltaType?: "up" | "down";
  note?: string;
}

// Types matching Prisma API responses
export interface ApiOrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  menuItem: {
    id: string;
    name: string;
    type: MenuItemType;
    price: number;
  };
}

export interface ApiStaff {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  pin: string;
  role: StaffRole;
  restaurantId: string;
}

export interface ApiCustomer {
  id: string;
  phone: string;
  name: string;
  visitCount: number;
  totalSpent: number;
  lastVisitAt: string;
  restaurantId: string;
}

export interface ApiOrder {
  id: string;
  orderCode: string;
  tableId: string;
  restaurantId: string;
  staffId: string | null;
  staff: ApiStaff | null;
  customerPhone: string;
  customerName: string;
  customerId: string | null;
  status: OrderStatus;
  specialNote: string;
  subtotal: number;
  tax: number;
  total: number;
  placedAt: string;
  confirmedAt: string | null;
  cookingAt: string | null;
  readyAt: string | null;
  billedAt: string | null;
  settledAt: string | null;
  items: ApiOrderItem[];
  table: ApiDiningTable;
}

export interface ApiDiningTable {
  id: string;
  tableNumber: number;
  label: string;
  capacity: number;
  active: boolean;
  status: TableStatus;
  restaurantId: string;
}

export interface ApiMenuCategory {
  id: string;
  name: string;
  emoji: string;
  sortOrder: number;
  items: ApiMenuItem[];
}

export interface ApiMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: MenuItemType;
  available: boolean;
  categoryId: string;
  restaurantId: string;
}

export interface DashboardStats {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  activeTables: number;
  totalTables: number;
  dailyRevenue: number[];
  dailyOrderCount: number[];
  dayLabels: string[];
  weeklyRevenue: number;
  topItems: { name: string; count: number }[];
}

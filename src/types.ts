export type ViewState =
  | 'WELCOME_SLIDER'
  | 'GOOGLE_LOGIN'
  | 'ROLE_SELECTION'
  | 'CUSTOMER_LANDING'
  | 'STORE'
  | 'MANAGER_PORTAL'
  | 'WAITER_PORTAL'
  | 'BARTENDER_PORTAL'
  | 'STOCK_MANAGER_PORTAL';

export type ModalState =
  | 'NONE'
  | 'MANAGER_PIN'
  | 'WORKER_LOGIN'
  | 'CUSTOMER_NAME'
  | 'PAYMENT_METHOD'
  | 'MPESA_PHONE'
  | 'CASH_CONFIRM'
  | 'TABLE_QR_PREVIEW'
  | 'SWITCH_ACCOUNT';

export interface AuthUser {
  email: string;
  name: string;
  photoUrl?: string;
  businessName: string;
  businessId: string;
  role: 'MANAGER';
}

export interface RestaurantTable {
  id: string;
  number?: string; // e.g. "1", "2", "3", "VIP 1"
  name: string; // e.g. "Table 1", "Table 2", "VIP Lounge 1"
  section?: string; // e.g. "Main Hall", "VIP Lounge", "Terrace", "Bar Counter"
  zone?: string; // "Main Hall", "Terrace", "Bar Counter", "VIP Lounge"
  capacity?: number;
  qrCodeDataUrl?: string;
  assignedWaiterId?: string;
  assignedWaiterName?: string;
  status?: 'Available' | 'Occupied' | 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  activeOrdersCount?: number;
  createdAt?: string;
}

export type TableConfig = RestaurantTable;

export interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  volume: string;
  sold: number;
  remaining: number;
  buyPrice: number;
  sellPrice: number;
}

export interface LedgerSale {
  id: string;
  time: string;
  item: string;
  cost: number;
  sold: number;
  profit: number;
}

export interface ManagerNotification {
  id: string;
  type: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'ORDER_PLACED' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  date: string;
  read: boolean;
  relatedItemId?: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
}

export type Category =
  | 'All'
  | 'Beer'
  | 'Whiskey'
  | 'Vodka'
  | 'Rum'
  | 'Gin'
  | 'Wine'
  | 'Cocktails'
  | 'Soda'
  | 'Non-Alcoholic';

export interface Product {
  id: string;
  name: string;
  category: Category;
  volume: string;
  abv: string;
  price: number;
  imageType: string;
  description?: string;
  origin?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type EmployeeRole = 'Bartender' | 'Cashier' | 'Waiter' | 'Stock Manager';

export interface CustomerRating {
  id: string;
  rating: number; // 1 to 5 stars
  orderId?: string;
  customerName?: string;
  feedback?: string;
  timestamp: string;
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  staffId: string;
  pin: string;
  phone: string;
  nationalId?: string;
  avatarUrl?: string;
  status: 'ON_DUTY' | 'OFF_DUTY' | 'ABSENT';
  shiftStart?: string;
  salesToday?: number;
  ratings?: CustomerRating[];
  averageRating?: number; // compiled average out of 5 stars
  totalRatingsCount?: number;
}

export type PaymentMethod = 'mpesa' | 'cash';

export interface DailyLedgerRecord {
  id: string;
  date: string;
  formattedDate: string;
  totalBottlesSold: number;
  grossRevenue: number;
  costOfGoods: number;
  netProfit: number;
  sales: LedgerSale[];
}

export interface ManagerAccount {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  venueName?: string;
  pin?: string;
  securityQuestion?: string;
  securityAnswer?: string;
}

export interface VenueInfo {
  businessId: string;
  businessName: string;
  managerEmail: string;
  tables: RestaurantTable[];
}

export interface OrderItem {
  id: string;
  name: string;
  bottleType: string;
  quantity: number;
}

export type OrderStatus = 'Pending' | 'Accepted' | 'Declined' | 'Preparing' | 'Incoming' | 'Served' | 'Completed';

export interface Order {
  id: string;
  businessId?: string;
  tableId?: string;
  customerName: string;
  table: string;
  timeAgo: string;
  minutesAgo: number;
  status: OrderStatus;
  trackingStep: 1 | 2 | 3 | 4 | 5; // 1: Order Placed, 2: Order Received, 3: Preparing, 4: Order Incoming, 5: Payment
  paymentMethod?: PaymentMethod;
  paymentConfirmed?: boolean;
  items: OrderItem[];
  total: number;
  waiterName?: string;
}


export type RoleMode = 'customer' | 'kitchen' | 'admin' | 'simulator';

export type OrderStatus = 'placed' | 'accepted' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

export interface CategoryItem {
  id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  categoryName?: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  image?: string; // fallback mapping
  is_veg: boolean;
  spice_level?: 'none' | 'mild' | 'spicy';
  is_available: boolean;
  inStock?: boolean; // fallback mapping
  is_bestseller: boolean;
  rating?: number;
  reviewsCount?: number;
  calories?: number;
  prepTimeMinutes?: number;
  ingredients?: string[];
  customizations?: {
    name: string;
    options: { label: string; extraPrice: number }[];
  }[];
}

export interface CartItemOption {
  categoryName: string;
  optionLabel: string;
  extraPrice: number;
}

export interface CartItem {
  id: string; // unique cart item instance id
  menuItemId: string;
  name: string;
  price: number;
  basePrice: number;
  quantity: number;
  image_url: string;
  is_veg: boolean;
  options?: CartItemOption[];
  specialNote?: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  changed_at: number;
}

export interface OrderItem {
  menu_item_id: string;
  name: string;
  price: number;
  qty: number;
  notes?: string;
  is_veg: boolean;
  options?: CartItemOption[];
}

export interface Order {
  id: string;
  orderNumber: string;
  table_id: string;
  table_number: number;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip?: number;
  total: number;
  created_at: number;
  updated_at: number;
  status_history: OrderStatusHistoryItem[];
  discount?: number;
  couponApplied?: string;
  customerName?: string;
  specialInstructions?: string;
  isMock?: boolean;
}

export type WaiterRequestType = 'water' | 'call_waiter' | 'bring_bill' | 'clean_table';

export interface WaiterRequest {
  id: string;
  tableId: string;
  type: WaiterRequestType;
  label: string;
  status: 'pending' | 'acknowledged' | 'completed';
  createdAt: number;
}

export interface TableInfo {
  id: string;
  table_number: number;
  qr_url: string;
  status: 'available' | 'occupied';
  active_order_id: string | null;
  capacity?: number;
}

export interface StaffUser {
  uid: string;
  name: string;
  role: 'admin' | 'kitchen';
}

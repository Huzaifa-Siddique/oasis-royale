export type Dish = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  model_url?: string;
  poster_url?: string;
  ios_src?: string;
  is_available: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type OrderStatus = "pending" | "processing" | "ready" | "completed" | "cancelled";

export type OrderCancellation = {
  reason: string;
  cancelled_by: string;
  cancelled_at: string;
};

export type OrderItem = {
  dish_id: string;
  name: string;
  quantity: number;
  price: number;
};

export type OrderSource = "qr" | "counter";

export type Tags = "No Mobile Customer" | "Walk-in" | "Large Group";

export type OrderPriority = "normal" | "vip";

export type Order = {
  id: string;
  order_short_id: number;
  session_id: string;
  table_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  source: OrderSource;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  estimated_minutes: number | null;
  tags: Tags[];
  priority: OrderPriority;
  cancellation: OrderCancellation | null;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
  special_instructions?: string | null;
  customization_charge?: number | null;
  customization_status?: string | null;
  customization_notes?: string | null;
  discount_code?: string | null;
  discount_amount?: number | null;
};

export type Favorite = {
  id: string;
  user_id: string;
  dish_id: string;
  created_at: string;
};

export type Tables = {
  dishes: Dish;
  orders: Order;
  favorites: Favorite;
};

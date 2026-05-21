export type Dish = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  model_url?: string;
  poster_url?: string;
  is_available: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type OrderStatus = "pending" | "processing" | "ready" | "completed" | "cancelled";

export type OrderCancellation = {
  reason: string;
  by: string;
  time: string;
};

export type Order = {
  id: string;
  order_short_id: number;
  session_id: string;
  table_id: string;
  items: { dish_id: string; name: string; quantity: number; price: number }[];
  total: number;
  status: OrderStatus;
  cancellation: OrderCancellation | null;
  created_at: string;
  updated_at: string;
};

export type Tables = {
  dishes: Dish;
  orders: Order;
};

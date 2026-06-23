export type RoomType = "suite" | "deluxe" | "standard" | "penthouse";

export type RoomStatus = "available" | "occupied" | "maintenance" | "booked";

export type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";

export interface Room {
  id: string;
  name: string;
  slug: string;
  type: RoomType;
  description: string;
  price_per_night: number;
  capacity: number;
  size_sqm: number;
  bed_type: string;
  amenities: string[];
  images: string[];
  is_available: boolean;
  status: RoomStatus;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Booking {
  id: string;
  room_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: BookingStatus;
  special_requests?: string;
  session_id?: string;
  cancellation?: {
    reason: string;
    cancelled_by: string;
    cancelled_at: string;
  } | null;
  created_at: string;
  rooms?: Room;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "staff";
}

export interface DashboardStats {
  total_rooms: number;
  available_rooms: number;
  active_bookings: number;
  revenue_today: number;
  revenue_this_month: number;
  occupancy_rate: number;
}

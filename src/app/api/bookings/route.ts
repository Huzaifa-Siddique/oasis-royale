import { NextRequest } from "next/server";

interface BookingRecord {
  id: string;
  room_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  special_requests?: string;
  created_at: string;
}

const bookings: BookingRecord[] = [];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const email = searchParams.get("email");
  const status = searchParams.get("status");

  let filtered = [...bookings];
  if (email) filtered = filtered.filter((b) => b.guest_email === email);
  if (status) filtered = filtered.filter((b) => b.status === status);

  return Response.json({ bookings: filtered });
}

export async function POST(request: Request) {
  const body = await request.json();

  const newBooking: BookingRecord = {
    id: crypto.randomUUID(),
    room_id: body.room_id,
    guest_name: body.guest_name,
    guest_email: body.guest_email,
    guest_phone: body.guest_phone,
    check_in: body.check_in,
    check_out: body.check_out,
    guests: body.guests,
    total_price: body.total_price,
    status: "confirmed",
    special_requests: body.special_requests,
    created_at: new Date().toISOString(),
  };

  bookings.push(newBooking);
  return Response.json({ booking: newBooking }, { status: 201 });
}

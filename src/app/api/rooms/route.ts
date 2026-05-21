import { NextRequest } from "next/server";

const rooms = [
  { id: "1", name: "Royal Penthouse", slug: "royal-penthouse", type: "penthouse", price_per_night: 2500, capacity: 4, is_available: true },
  { id: "2", name: "Golden Suite", slug: "golden-suite", type: "suite", price_per_night: 1500, capacity: 3, is_available: true },
  { id: "3", name: "Desert Deluxe", slug: "desert-deluxe", type: "deluxe", price_per_night: 800, capacity: 2, is_available: true },
  { id: "4", name: "Oasis Standard", slug: "oasis-standard", type: "standard", price_per_night: 400, capacity: 2, is_available: true },
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const available = searchParams.get("available");

  let filtered = rooms;
  if (type) filtered = filtered.filter((r) => r.type === type);
  if (available === "true") filtered = filtered.filter((r) => r.is_available);

  return Response.json({ rooms: filtered });
}

export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ message: "Room created", room: body }, { status: 201 });
}

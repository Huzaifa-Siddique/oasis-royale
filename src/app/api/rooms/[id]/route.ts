import { NextRequest } from "next/server";

const rooms = [
  { id: "1", name: "Royal Penthouse", price_per_night: 2500 },
  { id: "2", name: "Golden Suite", price_per_night: 1500 },
  { id: "3", name: "Desert Deluxe", price_per_night: 800 },
  { id: "4", name: "Oasis Standard", price_per_night: 400 },
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const room = rooms.find((r) => r.id === id);
  if (!room) {
    return Response.json({ error: "Room not found" }, { status: 404 });
  }
  return Response.json({ room });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  return Response.json({ message: `Room ${id} updated`, updates: body });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return Response.json({ message: `Room ${id} deleted` });
}

import { supabase } from "@/lib/supabase";

function generateShortId(): number {
  return Math.floor(100 + Math.random() * 900);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table_id, items, total } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "Items are required" }, { status: 400 });
    }

    const orderShortId = generateShortId();

    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_short_id: orderShortId,
        session_id: crypto.randomUUID(),
        table_id: table_id || "walk-in",
        items,
        total,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(orders, { status: 200 });
}

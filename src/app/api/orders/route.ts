import { getSupabaseClient } from "@/lib/supabase";
import { authenticateRequest, requireRole } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      session_id,
      table_id,
      items,
      total,
      customer_name,
      customer_phone,
      source = "qr",
      tags = [],
      priority = "normal",
      estimated_minutes,
    } = body;

    const supabase = getSupabaseClient();
    if (!supabase) {
      return Response.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const { data: statusRow } = await supabase
      .from("restaurant_status")
      .select("is_open")
      .limit(1)
      .single();
    if (statusRow && !statusRow.is_open) {
      return Response.json({ error: "Restaurant is closed", code: "RESTAURANT_CLOSED" }, { status: 503 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "Items are required" }, { status: 400 });
    }

    // Validate items structure
    for (const item of items) {
      if (!item.dish_id || typeof item.dish_id !== "string") {
        return Response.json({ error: "Each item must have a valid dish_id" }, { status: 400 });
      }
    }

    const finalSessionId = session_id || crypto.randomUUID();

    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("session_id", finalSessionId)
      .in("status", ["pending", "processing"]);

    if (count && count > 0) {
      return Response.json({ error: "An active order already exists for this session" }, { status: 409 });
    }

    // Validate table_id against restaurant_tables (if not walk-in)
    if (table_id && table_id !== "walk-in") {
      const { data: validTable } = await supabase
        .from("restaurant_tables")
        .select("id")
        .eq("id", table_id)
        .eq("is_active", true)
        .single();

      if (!validTable) {
        return Response.json({ error: "Invalid table ID" }, { status: 400 });
      }
    }

    // --- Server-side price validation ---
    // Fetch fresh dish prices and recalculate total
    const dishIds = items.map((item: { dish_id: string }) => item.dish_id);
    const { data: freshDishes } = await supabase
      .from("dishes")
      .select("id, price, name")
      .in("id", dishIds);

    const dishMap = new Map((freshDishes || []).map((d) => [d.id, d]));

    // Validate and rebuild items with server-side prices
    const validatedItems = items.map((item: { dish_id: string; name?: string; quantity?: number; price?: number }) => {
      const dish = dishMap.get(item.dish_id);
      return {
        dish_id: item.dish_id,
        name: dish?.name ?? item.name ?? "Unknown",
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
        price: dish?.price ?? 0,
      };
    });

    const calculatedTotal = validatedItems.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );

    // Sanity check: total must be positive and within 10% of calculated total
    if (calculatedTotal <= 0) {
      return Response.json({ error: "Order total must be greater than zero" }, { status: 400 });
    }
    if (Math.abs(total - calculatedTotal) > calculatedTotal * 0.1) {
      // Client total doesn't match — use server-calculated total
      // (This handles both malicious manipulation and stale cart prices)
    }

    const { data, error } = await supabase
      .from("orders")
      .insert({
        session_id: finalSessionId,
        table_id: table_id || "walk-in",
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        source,
        items: validatedItems,
        total: calculatedTotal,
        tags,
        priority,
        estimated_minutes: estimated_minutes || null,
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

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  const url = new URL(request.url);
  const session_id = url.searchParams.get("session_id");
  if (!(auth.user === null && session_id)) {
    const authError = requireRole(auth, ["staff", "admin"]);
    if (authError) return authError;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const source = url.searchParams.get("source");
  const status = url.searchParams.get("status");
  const order_short_id = url.searchParams.get("order_short_id");
  const has_phone = url.searchParams.get("has_phone");

  let query = supabase.from("orders").select("*");

  if (order_short_id) {
    query = query.eq("order_short_id", Number(order_short_id));
  } else if (source) {
    query = query.eq("source", source);
  }
  if (session_id) {
    query = query.eq("session_id", session_id);
  } else if (status) {
    if (status === "active") {
      query = query.in("status", ["processing", "ready"]);
    } else {
      query = query.eq("status", status);
    }
  }
  if (has_phone === "true") {
    query = query.not("customer_phone", "is", null).neq("customer_phone", "");
  }

  const date_from = url.searchParams.get("date_from");
  const date_to = url.searchParams.get("date_to");

  if (date_from) {
    const from = date_from === "today"
      ? new Date().toISOString().slice(0, 10) + "T00:00:00.000Z"
      : date_from;
    query = query.gte("created_at", from);
  }
  if (date_to) {
    query = query.lte("created_at", date_to);
  }

  const { data: orders, error } = await query
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(orders, { status: 200 });
}

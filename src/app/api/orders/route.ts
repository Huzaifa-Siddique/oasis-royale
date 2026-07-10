import { getSupabaseClient } from "@/lib/supabase";
import { authenticateRequest, requireRole } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const user_id = auth.user ? auth.user.id : null;

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
      special_instructions,
      customization_status = "none",
      discount_code,
    } = body;

    const supabase = getSupabaseClient();
    if (!supabase) {
      return Response.json({ error: "Supabase not configured" }, { status: 500 });
    }
    const { data: statusRow } = await supabase
      .from("restaurant_status")
      .select("is_open, tax_rate, service_charge, discount_codes")
      .limit(1)
      .single();

    if (statusRow && !statusRow.is_open) {
      return Response.json({ error: "Restaurant is closed", code: "RESTAURANT_CLOSED" }, { status: 503 });
    }

    const taxRate = statusRow?.tax_rate !== undefined ? Number(statusRow.tax_rate) : 8.25;
    const serviceCharge = statusRow?.service_charge !== undefined ? Number(statusRow.service_charge) : 10.00;
    const discountCodes = statusRow?.discount_codes || [];

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
    const dishIds = items.map((item: { dish_id: string }) => item.dish_id);
    const { data: freshDishes } = await supabase
      .from("dishes")
      .select("id, price, name, metadata")
      .in("id", dishIds);

    const dishMap = new Map((freshDishes || []).map((d) => [d.id, d]));

    // Validate and rebuild items with server-side prices and customizations
    const validatedItems = items.map((item: any) => {
      const dish = dishMap.get(item.dish_id);
      const dbCustomizations = dish?.metadata?.customizations || [];
      
      const validatedCustoms = (item.customizations || []).map((c: any) => {
        const dbCustom = dbCustomizations.find((dc: any) => dc.name === c.name);
        return {
          name: c.name,
          price: dbCustom?.price !== undefined ? Number(dbCustom.price) : 0,
        };
      });

      return {
        dish_id: item.dish_id,
        name: dish?.name ?? item.name ?? "Unknown",
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
        price: dish?.price ?? 0,
        customizations: validatedCustoms
      };
    });

    const subtotal = validatedItems.reduce(
      (sum: number, item: any) => {
        const customsPrice = (item.customizations || []).reduce((s: number, c: any) => s + c.price, 0);
        return sum + (item.price + customsPrice) * item.quantity;
      },
      0
    );

    if (subtotal <= 0) {
      return Response.json({ error: "Order total must be greater than zero" }, { status: 400 });
    }

    // Handle discounts
    let discountAmount = 0;
    if (discount_code) {
      const activeDiscount = discountCodes.find(
        (dc: any) => dc.code.toUpperCase() === discount_code.toUpperCase()
      );
      if (activeDiscount) {
        if (activeDiscount.type === "percent") {
          discountAmount = subtotal * (Number(activeDiscount.value) / 100);
        } else if (activeDiscount.type === "fixed") {
          discountAmount = Number(activeDiscount.value);
        }
      }
    }
    discountAmount = Math.min(discountAmount, subtotal);

    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = afterDiscount * (taxRate / 100);
    const serviceChargeAmount = afterDiscount * (serviceCharge / 100);
    const grandTotal = afterDiscount + taxAmount + serviceChargeAmount;

    const { data, error } = await supabase
      .from("orders")
      .insert({
        session_id: finalSessionId,
        table_id: table_id || "walk-in",
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        source,
        items: validatedItems,
        total: grandTotal,
        tags,
        priority,
        estimated_minutes: estimated_minutes || null,
        status: "pending",
        user_id,
        special_instructions: special_instructions || null,
        customization_status: customization_status || "none",
        customization_charge: 0.00,
        discount_code: discount_code || null,
        discount_amount: discountAmount
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data, { status: 201 });
  } catch (err: any) {
    console.error("Order API Error:", err);
    return Response.json({ error: err.message || "Invalid request" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  const url = new URL(request.url);
  const session_id = url.searchParams.get("session_id");
  const user_id = url.searchParams.get("user_id");

  if (auth.user && auth.profile?.role === "customer") {
    // Customers can only see their own orders (by user_id or matching session_id)
    if (user_id !== auth.user.id && !session_id) {
      return Response.json({ error: "Access denied. Can only view own orders." }, { status: 403 });
    }
  } else if (!auth.user && session_id) {
    // Guest accessing by session_id: allow
  } else {
    // Staff/Admin access check
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
  
  if (user_id) {
    query = query.eq("user_id", user_id);
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

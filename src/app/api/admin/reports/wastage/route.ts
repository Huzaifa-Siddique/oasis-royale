import { getSupabaseClient } from "@/lib/supabase";
import { authenticateRequest, requireRole } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  const authError = requireRole(auth, ["staff", "admin"]);
  if (authError) return authError;

  const supabase = getSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const date_from = url.searchParams.get("date_from");
  const date_to = url.searchParams.get("date_to");

  let query = supabase.from("orders").select("id, items, total, created_at, cancellation");

  query = query.eq("status", "cancelled");

  if (date_from) {
    query = query.gte("created_at", date_from);
  }
  if (date_to) {
    query = query.lte("created_at", date_to);
  }

  const { data: orders, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const dishWastage: Record<string, { name: string; quantity: number; revenue: number }> = {};

  for (const order of orders ?? []) {
    const items = order.items as Array<{ dish_id: string; name: string; quantity: number; price: number }>;
    for (const item of items) {
      if (!dishWastage[item.dish_id]) {
        dishWastage[item.dish_id] = { name: item.name, quantity: 0, revenue: 0 };
      }
      dishWastage[item.dish_id].quantity += item.quantity;
      dishWastage[item.dish_id].revenue += item.price * item.quantity;
    }
  }

  const dishIds = Object.keys(dishWastage);
  let categoryMap: Record<string, string> = {};

  if (dishIds.length > 0) {
    const { data: dishes } = await supabase
      .from("dishes")
      .select("id, category")
      .in("id", dishIds);

    if (dishes) {
      for (const d of dishes) {
        categoryMap[d.id] = d.category;
      }
    }
  }

  const byCategory: Record<string, { quantity: number; revenue: number; dishes: typeof dishWastage }> = {};

  for (const [dishId, data] of Object.entries(dishWastage)) {
    const category = categoryMap[dishId] || "Unknown";
    if (!byCategory[category]) {
      byCategory[category] = { quantity: 0, revenue: 0, dishes: {} };
    }
    byCategory[category].quantity += data.quantity;
    byCategory[category].revenue += data.revenue;
    byCategory[category].dishes[dishId] = data;
  }

  const totalWastage = Object.values(dishWastage).reduce(
    (sum, d) => ({ quantity: sum.quantity + d.quantity, revenue: sum.revenue + d.revenue }),
    { quantity: 0, revenue: 0 }
  );

  return Response.json({
    total: totalWastage,
    byCategory,
    byDish: dishWastage,
    cancelledCount: orders?.length ?? 0,
  });
}

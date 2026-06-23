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

  let query = supabase.from("orders").select("table_id, total, status, created_at");

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

  const tableMap: Record<string, { orderCount: number; revenue: number; cancelledCount: number }> = {};

  for (const order of orders ?? []) {
    const tableId = order.table_id || "walk-in";
    if (!tableMap[tableId]) {
      tableMap[tableId] = { orderCount: 0, revenue: 0, cancelledCount: 0 };
    }
    tableMap[tableId].orderCount++;
    if (order.status === "cancelled") {
      tableMap[tableId].cancelledCount++;
    } else {
      tableMap[tableId].revenue += order.total;
    }
  }

  const maxRevenue = Math.max(...Object.values(tableMap).map((t) => t.revenue), 1);
  const maxOrders = Math.max(...Object.values(tableMap).map((t) => t.orderCount), 1);

  const tables = Object.entries(tableMap).map(([tableId, data]) => ({
    tableId,
    ...data,
    intensity: Math.round((data.revenue / maxRevenue + data.orderCount / maxOrders) / 2 * 100),
  }));

  return Response.json({
    tables,
    totalOrderCount: orders?.length ?? 0,
    totalRevenue: tables.reduce((s, t) => s + t.revenue, 0),
  });
}

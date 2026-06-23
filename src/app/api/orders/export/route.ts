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

  let query = supabase.from("orders").select("*");

  if (date_from) {
    query = query.gte("created_at", date_from);
  }
  if (date_to) {
    query = query.lte("created_at", date_to);
  }

  const { data: orders, error } = await query
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const headers = [
    "OrderID",
    "ShortID",
    "Source",
    "Customer",
    "Table",
    "Items",
    "Total",
    "Status",
    "Cancelled",
    "PickedUp",
    "CreatedAt",
  ];

  const rows = (orders ?? []).map((o: Record<string, unknown>) => [
    o.id,
    o.order_short_id,
    o.source,
    o.customer_name ?? "",
    o.table_id,
    JSON.stringify(o.items),
    o.total,
    o.status,
    o.cancellation ? JSON.stringify(o.cancellation) : "",
    "",
    o.created_at,
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((v: unknown) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=orders-export.csv",
    },
  });
}

import { getSupabaseClient } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session_id } = await request.json();
    const { id } = await params;

    if (!session_id) {
      return Response.json({ error: "session_id is required" }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return Response.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Fetch order to verify session_id match and status
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("session_id, status, created_at")
      .eq("id", id)
      .single();

    if (fetchErr || !order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.session_id !== session_id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (order.status !== "pending") {
      return Response.json({ error: "Can only cancel pending orders" }, { status: 409 });
    }

    // 30-second window check
    const createdAt = new Date(order.created_at).getTime();
    if (Date.now() - createdAt > 30 * 1000) {
      return Response.json({ error: "Cancellation window expired (30 seconds)" }, { status: 410 });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: now,
        status_changed_at: now,
        cancellation: {
          reason: "customer_cancelled",
          cancelled_by: "customer",
          cancelled_at: now,
        },
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data, { status: 200 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
import { getSupabaseClient, getSupabaseAuthClient } from "@/lib/supabase";
import { authenticateRequest, requireRole } from "@/lib/api-auth";

const ALLOWED_STATUSES = ["pending", "processing", "ready", "completed", "cancelled"] as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    const authError = requireRole(auth, ["staff", "admin"]);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const { status, cancellation, estimated_minutes, estimated_minutes_set_by } = body;

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    if (status === "cancelled") {
      if (!cancellation?.reason) {
        return Response.json(
          { error: "Cancellation reason is required when status is cancelled" },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseAuthClient(auth.token!);
    if (!supabase) {
      return Response.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // --- Fetch current order (needed for ETA validation & eta_changes append) ---
    const { data: current, error: fetchErr } = await supabase
      .from("orders")
      .select("status, estimated_minutes, eta_changes, customer_phone")
      .eq("id", id)
      .single();

    if (fetchErr || !current) {
      return Response.json({ error: fetchErr?.message ?? "Order not found" }, { status: 404 });
    }

    // --- Validate kitchen can only INCREASE ETA ---
    const setBy = estimated_minutes_set_by || auth.profile?.name || auth.user?.email || "unknown";
    const oldEta = current.estimated_minutes;
    if (estimated_minutes !== undefined && estimated_minutes !== null) {
      if (oldEta !== null && estimated_minutes < oldEta) {
        return Response.json(
          { error: "Kitchen can only increase estimated minutes (not decrease)" },
          { status: 400 }
        );
      }
    }

    // --- State machine validation (only when status is changing) ---
    if (status && status !== current.status) {
      const allowed = VALID_TRANSITIONS[current.status];
      if (!allowed || !allowed.includes(status)) {
        return Response.json(
          { error: `Cannot transition from "${current.status}" to "${status}"` },
          { status: 409 }
        );
      }
    }

    // --- Build update payload ---
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      updated_at: now,
    };
    if (status) {
      updateData.status = status;
    }

    // Graceful status_changed_at: try with column, catch column-not-found later
    updateData.status_changed_at = now;

    if (cancellation) {
      updateData.cancellation = cancellation;
    }

    // --- Handle ETA changes ---
    if (estimated_minutes !== undefined) {
      updateData.estimated_minutes = estimated_minutes;
      updateData.estimated_minutes_set_by = setBy;

      const etaChanges: Array<{ from: number | null; to: number; set_by: string; changed_at: string }> =
        Array.isArray(current.eta_changes) ? current.eta_changes : [];

      etaChanges.push({
        from: oldEta,
        to: estimated_minutes,
        set_by: setBy,
        changed_at: now,
      });

      updateData.eta_changes = JSON.stringify(etaChanges);
    }

    // --- Execute update (with column-not-found fallback) ---
    let { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    // Graceful degradation: if status_changed_at column is missing, retry without it
    if (error?.message?.includes('column "status_changed_at" does not exist')) {
      delete updateData.status_changed_at;
      const result = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // --- WhatsApp notification for ETA changes >5min (non-blocking fire-and-forget) ---
    if (
      estimated_minutes !== undefined &&
      oldEta !== null &&
      Math.abs(estimated_minutes - oldEta) >= 5 &&
      current.customer_phone
    ) {
      notifyEtaChange(auth.token!, current.customer_phone, oldEta, estimated_minutes).catch(() => {});
    }

    return Response.json(data, { status: 200 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

// --- WhatsApp notification helper (placeholder — log to eta_notifications table) ---
async function notifyEtaChange(token: string, phone: string, from: number, to: number): Promise<void> {
  const supabase = getSupabaseAuthClient(token);
  if (!supabase) return;

  const message = `Your order ETA has changed from ${from} min to ${to} min.`;
  // Log to notifications table for later processing (fire-and-forget)
  supabase.from("eta_notifications").insert({
    phone,
    message,
    old_eta: from,
    new_eta: to,
    sent_at: new Date().toISOString(),
  });
}
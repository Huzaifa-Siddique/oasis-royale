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
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      cancellation,
      estimated_minutes,
      estimated_minutes_set_by,
      customization_status,
      customization_charge,
      customization_notes,
      session_id
    } = body;

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

    const supabase = getSupabaseClient();
    if (!supabase) {
      return Response.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Fetch current order to check owner and customizations
    const { data: currentOrder, error: fetchErr } = await supabase
      .from("orders")
      .select("status, user_id, session_id, estimated_minutes, eta_changes, customer_phone, customization_status, customization_charge, total, items, discount_amount")
      .eq("id", id)
      .single();

    if (fetchErr || !currentOrder) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const isStaffOrAdmin = auth.profile?.role === "staff" || auth.profile?.role === "admin";
    const isOwner = (auth.user && auth.user.id === currentOrder.user_id) || (session_id && session_id === currentOrder.session_id);

    if (!isStaffOrAdmin && !isOwner) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    // Security check: Customer can only modify customization acceptance, notes or cancellation
    if (!isStaffOrAdmin) {
      if (estimated_minutes !== undefined || estimated_minutes_set_by !== undefined || customization_charge !== undefined) {
        return Response.json({ error: "Unauthorized changes" }, { status: 403 });
      }
      if (status && status !== "cancelled") {
        return Response.json({ error: "Unauthorized status transition" }, { status: 403 });
      }
    }

    const activeSupabase = auth.token ? getSupabaseAuthClient(auth.token) : supabase;

    // --- Fetch current order columns for ETA ---
    let hasEtaChangesColumn = true;
    // Check if eta_changes exists in currentOrder (was fetched in currentOrder select)
    if (!("eta_changes" in currentOrder)) {
      hasEtaChangesColumn = false;
    }

    // --- Validate kitchen can only INCREASE ETA ---
    const setBy = estimated_minutes_set_by || auth.profile?.name || auth.user?.email || "unknown";
    const oldEta = currentOrder.estimated_minutes;
    if (estimated_minutes !== undefined && estimated_minutes !== null) {
      if (oldEta !== null && estimated_minutes < oldEta) {
        return Response.json(
          { error: "Kitchen can only increase estimated minutes (not decrease)" },
          { status: 400 }
        );
      }
    }

    // --- State machine validation (only when status is changing) ---
    if (status && status !== currentOrder.status) {
      const allowed = VALID_TRANSITIONS[currentOrder.status];
      if (!allowed || !allowed.includes(status)) {
        return Response.json(
          { error: `Cannot transition from "${currentOrder.status}" to "${status}"` },
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

    updateData.status_changed_at = now;

    if (cancellation) {
      updateData.cancellation = cancellation;
    }

    if (customization_status !== undefined) {
      updateData.customization_status = customization_status;
    }

    if (customization_charge !== undefined && isStaffOrAdmin) {
      updateData.customization_charge = Number(customization_charge);
    }

    if (customization_notes !== undefined) {
      updateData.customization_notes = customization_notes;
    }

    // Automatically recalculate grand total if customer accepts/approves proposed customization charge
    if (customization_status === "approved" && currentOrder.customization_status === "proposed") {
      const { data: statusRow } = await supabase
        .from("restaurant_status")
        .select("tax_rate, service_charge")
        .limit(1)
        .single();
      const taxRate = statusRow?.tax_rate !== undefined ? Number(statusRow.tax_rate) : 8.25;
      const serviceCharge = statusRow?.service_charge !== undefined ? Number(statusRow.service_charge) : 10.00;

      const subtotal = (currentOrder.items as any[]).reduce(
        (sum: number, item: any) => {
          const customsPrice = (item.customizations || []).reduce((s: number, c: any) => s + c.price, 0);
          return sum + (item.price + customsPrice) * item.quantity;
        },
        0
      );
      const afterDiscount = Math.max(0, subtotal - (currentOrder.discount_amount || 0));
      const finalSubtotal = afterDiscount + Number(currentOrder.customization_charge);
      const taxAmount = finalSubtotal * (taxRate / 100);
      const serviceChargeAmount = finalSubtotal * (serviceCharge / 100);
      updateData.total = finalSubtotal + taxAmount + serviceChargeAmount;
    }

    // --- Handle ETA changes ---
    if (estimated_minutes !== undefined) {
      updateData.estimated_minutes = estimated_minutes;
      updateData.estimated_minutes_set_by = setBy;

      if (hasEtaChangesColumn) {
        let etaChanges: Array<{ from: number | null; to: number; set_by: string; changed_at: string }> = [];
        if ((currentOrder as any).eta_changes) {
          try {
            etaChanges = typeof (currentOrder as any).eta_changes === "string"
              ? JSON.parse((currentOrder as any).eta_changes)
              : (currentOrder as any).eta_changes;
          } catch {
            etaChanges = [];
          }
        }
        if (!Array.isArray(etaChanges)) {
          etaChanges = [];
        }

        etaChanges.push({
          from: oldEta,
          to: estimated_minutes,
          set_by: setBy,
          changed_at: now,
        });

        updateData.eta_changes = JSON.stringify(etaChanges);
      }
    }

    // --- Execute update (with column-not-found fallback) ---
    let { data, error } = await activeSupabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    // Graceful degradation: if eta_changes column is missing, retry without it
    if (error?.message?.includes('column "eta_changes" does not exist')) {
      delete updateData.eta_changes;
      const result = await activeSupabase
        .from("orders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    // Graceful degradation: if status_changed_at column is missing, retry without it
    if (error?.message?.includes('column "status_changed_at" does not exist')) {
      delete updateData.status_changed_at;
      const result = await activeSupabase
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
      currentOrder.customer_phone
    ) {
      notifyEtaChange(auth.token!, currentOrder.customer_phone, oldEta, estimated_minutes).catch(() => {});
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
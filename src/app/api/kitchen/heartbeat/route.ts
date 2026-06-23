import { getSupabaseClient, getSupabaseAuthClient } from "@/lib/supabase";
import { authenticateRequest, requireRole } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    const authError = requireRole(auth, ["staff", "admin"]);
    if (authError) return authError;

    const supabase = getSupabaseAuthClient(auth.token!);
    if (!supabase) {
      return Response.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { error } = await supabase
      .from("kitchen_heartbeats")
      .upsert({ user_id: auth.user!.id, last_heartbeat: new Date().toISOString() });

    if (error) {
      console.error("[Heartbeat] POST error:", error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return Response.json({ active: false });
    }

    const threshold = new Date(Date.now() - 60000).toISOString();
    const { data, error } = await supabase
      .from("kitchen_heartbeats")
      .select("user_id")
      .gt("last_heartbeat", threshold);

    if (error) {
      // Table might not exist yet — gracefully return inactive
      return Response.json({ active: false });
    }

    const active = (data?.length ?? 0) > 0;
    return Response.json({ active });
  } catch {
    return Response.json({ active: false });
  }
}

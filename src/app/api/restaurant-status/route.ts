import { getSupabaseClient, getSupabaseAuthClient } from "@/lib/supabase";
import { authenticateRequest, requireRole } from "@/lib/api-auth";

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 500 });
  
  const { data } = await supabase.from("restaurant_status").select("*").limit(1).single();
  return Response.json(data || { is_open: true });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  console.log("[restaurant-status POST] Auth header present:", !!authHeader);
  console.log("[restaurant-status POST] Auth header value:", authHeader ? authHeader.substring(0, 30) + "..." : "NONE");
  
  const auth = await authenticateRequest(request);
  console.log("[restaurant-status POST] Auth result:", JSON.stringify({ user: auth.user?.id, profile: auth.profile?.role, error: auth.error }));
  
  const authError = requireRole(auth, ["staff", "admin"]);
  if (authError) {
    console.log("[restaurant-status POST] REJECTED - requireRole returned error");
    return authError;
  }
  console.log("[restaurant-status POST] AUTHORIZED - proceeding");

  const supabase = getSupabaseAuthClient(auth.token!);
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 500 });

  const body = await request.json();
  const { is_open } = body;

  const updateData: Record<string, unknown> = {
    is_open,
    updated_at: new Date().toISOString(),
    updated_by: auth.profile?.name || auth.profile?.email || "admin"
  };

  // Get the existing row ID
  const { data: existing } = await supabase.from("restaurant_status").select("id").limit(1).single();
  
  const { data, error } = await supabase
    .from("restaurant_status")
    .update(updateData)
    .eq("id", existing?.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
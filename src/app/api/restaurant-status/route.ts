import { getSupabaseClient, getSupabaseAuthClient } from "@/lib/supabase";
import { authenticateRequest, requireRole } from "@/lib/api-auth";

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 500 });
  
  const { data } = await supabase.from("restaurant_status").select("*").limit(1).single();
  const responseData = {
    is_open: true,
    tax_rate: 8.25,
    service_charge: 10.00,
    discount_codes: [],
    ...data
  };
  return Response.json(responseData);
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
  const { is_open, tax_rate, service_charge, discount_codes } = body;

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: auth.profile?.name || auth.profile?.email || "admin"
  };

  if (is_open !== undefined) updateData.is_open = is_open;
  if (tax_rate !== undefined) updateData.tax_rate = Number(tax_rate);
  if (service_charge !== undefined) updateData.service_charge = Number(service_charge);
  if (discount_codes !== undefined) updateData.discount_codes = discount_codes;

  // Get the existing row ID
  const { data: existing } = await supabase.from("restaurant_status").select("id").limit(1).single();
  
  const { data, error } = await supabase
    .from("restaurant_status")
    .update(updateData)
    .eq("id", existing?.id)
    .select()
    .single();

  if (error) {
    console.error("Database update error:", error);
    // If it's a column not found error, try to update only the is_open column
    if (error.code === "42703") {
      const fallbackData: Record<string, any> = {
        updated_at: new Date().toISOString(),
        updated_by: auth.profile?.name || auth.profile?.email || "admin"
      };
      if (is_open !== undefined) fallbackData.is_open = is_open;
      const { data: fallbackResult, error: fallbackError } = await supabase
        .from("restaurant_status")
        .update(fallbackData)
        .eq("id", existing?.id)
        .select()
        .single();
      if (fallbackError) return Response.json({ error: fallbackError.message }, { status: 500 });
      return Response.json(fallbackResult);
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(data);
}
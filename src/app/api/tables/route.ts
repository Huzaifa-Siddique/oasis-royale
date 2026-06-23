import { getSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) return Response.json([], { status: 500 });

  const { data, error } = await supabase
    .from("restaurant_tables")
    .select("id, name")
    .eq("is_active", true)
    .order("id");

  if (error) return Response.json([], { status: 500 });
  return Response.json(data || []);
}

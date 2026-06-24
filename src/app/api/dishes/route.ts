import { NextResponse } from 'next/server';
import { getSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return Response.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data: dishes, error } = await supabase
    .from("dishes")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter out any dishes that do not have a 3D model
  const arDishes = (dishes || []).filter(
    (dish) => dish.model_url && dish.model_url.trim() !== ""
  );

  const response = NextResponse.json(arDishes, { status: 200 });
  response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=30');
  return response;
}

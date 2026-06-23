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

  const response = NextResponse.json(dishes || [], { status: 200 });
  response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=30');
  return response;
}

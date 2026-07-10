import { NextResponse } from "next/server";
import { getSupabaseAuthClient } from "@/lib/supabase";
import { authenticateRequest, requireRole } from "@/lib/api-auth";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  const authError = requireRole(auth, ["staff", "admin"]);
  if (authError) return authError;

  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      category,
      image_url,
      model_url,
      poster_url,
      ios_src,
      is_available,
    } = body;

    if (!name || price === undefined || !category) {
      return NextResponse.json({ error: "Name, price, and category are required" }, { status: 400 });
    }

    const supabase = getSupabaseAuthClient(auth.token!);
    const { data, error } = await supabase
      .from("dishes")
      .insert({
        name,
        description,
        price: Number(price),
        category,
        image_url: image_url || null,
        model_url: model_url || null,
        poster_url: poster_url || null,
        ios_src: ios_src || null,
        is_available: is_available !== undefined ? is_available : true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

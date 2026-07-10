import { NextResponse } from "next/server";
import { getSupabaseAuthClient, getSupabaseClient } from "@/lib/supabase";
import { authenticateRequest } from "@/lib/api-auth";

// GET /api/favorites: Retrieve all favorites for the logged-in user
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  if (!auth.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = getSupabaseAuthClient(auth.token!);
  const { data, error } = await supabase
    .from("favorites")
    .select("dish_id, created_at")
    .eq("user_id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || [], { status: 200 });
}

// POST /api/favorites: Add a dish to favorites
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  if (!auth.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { dish_id } = await request.json();
    if (!dish_id) {
      return NextResponse.json({ error: "dish_id is required" }, { status: 400 });
    }

    const supabase = getSupabaseAuthClient(auth.token!);
    
    // Insert favorite
    const { data, error } = await supabase
      .from("favorites")
      .insert({
        user_id: auth.user.id,
        dish_id: dish_id,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint conflict gracefully
      if (error.code === "23505") {
        return NextResponse.json({ message: "Already in favorites" }, { status: 200 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

// DELETE /api/favorites: Remove a dish from favorites
export async function DELETE(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  if (!auth.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    let dish_id = url.searchParams.get("dish_id");

    if (!dish_id) {
      const body = await request.json().catch(() => ({}));
      dish_id = body.dish_id;
    }

    if (!dish_id) {
      return NextResponse.json({ error: "dish_id is required" }, { status: 400 });
    }

    const supabase = getSupabaseAuthClient(auth.token!);
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", auth.user.id)
      .eq("dish_id", dish_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Favorite removed successfully" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

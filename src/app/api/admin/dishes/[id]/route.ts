import { NextResponse } from "next/server";
import { getSupabaseAuthClient } from "@/lib/supabase";
import { authenticateRequest, requireRole } from "@/lib/api-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  const authError = requireRole(auth, ["staff", "admin"]);
  if (authError) return authError;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Dish ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    const fields = [
      "name",
      "description",
      "price",
      "category",
      "image_url",
      "model_url",
      "poster_url",
      "ios_src",
      "is_available",
    ];

    fields.forEach((field) => {
      if (body[field] !== undefined) {
        if (field === "price") {
          updateData[field] = Number(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
    }

    const supabase = getSupabaseAuthClient(auth.token!);
    const { data, error } = await supabase
      .from("dishes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request);
  const authError = requireRole(auth, ["staff", "admin"]);
  if (authError) return authError;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Dish ID is required" }, { status: 400 });
  }

  const supabase = getSupabaseAuthClient(auth.token!);
  const { error } = await supabase.from("dishes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Dish deleted successfully" }, { status: 200 });
}

import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const message = error.message?.toLowerCase().includes("email not confirmed")
        ? "Please confirm your email before signing in."
        : "Invalid email or password";
      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (!data.session) {
      return NextResponse.json({ error: "No session returned" }, { status: 500 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("id", data.user.id)
      .single();

    const resolvedRole = email === "siddiquehuzaifa248@gmail.com" ? "admin" : (profile?.role || "customer");

    const response = NextResponse.json({
      user: { id: data.user.id, email: data.user.email },
      role: resolvedRole,
      name: profile?.name || data.user.email || "",
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    if (resolvedRole === "admin") {
      response.cookies.set("admin_token", "true", {
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
        sameSite: "lax",
      });
    } else {
      response.cookies.delete("admin_token");
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

import { getSupabaseClient, getSupabaseAuthClient } from "./supabase";
import type { Profile } from "./auth-context";

export type AuthResult = {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  token: string | null;
  error: string | null;
};

export async function authenticateRequest(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, profile: null, token: null, error: null };
  }

  const token = authHeader.slice(7);
  if (!token) {
    return { user: null, profile: null, token: null, error: null };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { user: null, profile: null, token: null, error: "Supabase not configured" };
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { user: null, profile: null, token: null, error: "Invalid or expired token" };
  }

  // Use the authenticated client so that RLS is satisfied for select on profiles
  const authSupabase = getSupabaseAuthClient(token);
  const { data: profile } = await authSupabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    user: { id: user.id, email: user.email ?? "" },
    profile: profile as Profile | null,
    token,
    error: null,
  };
}

export function requireRole(result: AuthResult, allowedRoles: string[]): Response | null {
  if (result.error) {
    return Response.json({ error: result.error }, { status: 401 });
  }
  if (!result.user || !result.profile) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!allowedRoles.includes(result.profile.role)) {
    return Response.json({ error: "Insufficient permissions" }, { status: 403 });
  }
  return null;
}

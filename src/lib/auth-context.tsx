"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { setAccessToken } from "@/lib/api-fetch";

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "staff" | "admin";
};

type AuthState = {
  user: User | null;
  profile: Profile | null;
  role: Profile["role"] | null;
  loading: boolean;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<{ role?: string; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ role?: string; error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  accessToken: null,
  signIn: async () => ({}),
  signUp: async () => ({}) as { role?: string; error?: string },
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const router = useRouter();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      const TIMEOUT_MS = 25000;
      const { data } = await Promise.race([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("fetchProfile timed out")), TIMEOUT_MS)
        ),
      ]);
      return data as Profile | null;
    } catch (err) {
      console.error("[Auth] fetchProfile error:", err);
      return null;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) { setLoading(false); return; }

      const TIMEOUT_MS = 25000;
      const { data: { session } } = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("getSession timed out")), TIMEOUT_MS)
        ),
      ]);

      const token = session?.access_token ?? null;
      setAccessTokenState(token);
      setAccessToken(token);
      setUser(session?.user ?? null);
      if (session?.user) {
        let p = await fetchProfile(session.user.id);
        if (session.user.email === "siddiquehuzaifa248@gmail.com") {
          if (!p) {
            p = {
              id: session.user.id,
              email: session.user.email,
              name: "Admin",
              role: "admin",
            };
          } else {
            p.role = "admin";
          }
        }
        setProfile(p);
      } else {
        setProfile(null);
      }

      const finalToken = session?.access_token ?? null;
      setAccessTokenState(finalToken);
      setAccessToken(finalToken);
    } catch (err) {
      console.error("[Auth] refreshSession error:", err);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) { setLoading(false); return; }

    refreshSession();

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "INITIAL_SESSION" && !session) return;

        const token = session?.access_token ?? null;
        setAccessTokenState(token);
        setAccessToken(token);
        setUser(session?.user ?? null);
        if (!session?.user) {
          setProfile(null);
        }
      });

      const refreshInterval = setInterval(() => {
        refreshSession();
      }, 10 * 60 * 1000);

      return () => {
        try { subscription?.unsubscribe(); } catch {}
        clearInterval(refreshInterval);
      };
    } catch (err) {
      console.error("[Auth] onAuthStateChange error:", err);
    }
  }, [refreshSession]);

  useEffect(() => {
    if (typeof window !== "undefined" && !loading) {
      if (profile?.role === "admin") {
        document.cookie = "admin_token=true; path=/; max-age=86400; SameSite=Lax";
      } else {
        document.cookie = "admin_token=; path=/; max-age=0; SameSite=Lax";
      }
    }
  }, [profile, loading]);

  const signIn = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: "Supabase not configured" };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          return { error: data.error || "Login failed" };
        }

        if (supabase && data.access_token) {
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
          setAccessTokenState(data.access_token);
          setAccessToken(data.access_token);
        }

        if (data.user) {
          const resolvedRole = email === "siddiquehuzaifa248@gmail.com" ? "admin" : data.role;
          setProfile({ id: data.user.id, email: data.user.email, name: data.name ?? resolvedRole, role: resolvedRole });
          return { role: resolvedRole };
        }

        return { role: data.role };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        return { error: "Login timed out. Please check your connection and try again." };
      }
      return { error: "Network error. Please check your connection and try again." };
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ role?: string; error?: string }> => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: "Supabase not configured" };

      const TIMEOUT_MS = 25000;
      const { data, error } = await Promise.race([
        supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timed out")), TIMEOUT_MS)
        ),
      ]);

      if (error) {
        if (error.message?.toLowerCase().includes("already registered") || error.message?.toLowerCase().includes("already exists")) {
          return { error: "Could not create account. Please try again or sign in." };
        }
        return { error: error.message };
      }

      if (!data?.user) {
        return { error: "Could not create account. Please try again or sign in." };
      }

      if (data?.session) {
        setUser(data.user);
        setAccessTokenState(data.session.access_token);
        setAccessToken(data.session.access_token);
        const p = await fetchProfile(data.user.id);
        setProfile(p);
        return { role: p?.role };
      }

      return {};
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("timed out")) {
        return { error: "Sign up timed out. Please check your connection and try again." };
      }
      return { error: "Network error. Please check your connection and try again." };
    }
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    await supabase?.auth.signOut();
    setUser(null);
    setProfile(null);
    setAccessTokenState(null);
    setAccessToken(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, profile, role: profile?.role ?? null, loading, accessToken, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export const useRole = () => useContext(AuthContext).role;

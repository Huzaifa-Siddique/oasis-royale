"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { User, Eye, EyeOff } from "lucide-react";
import { Button, Input } from "@/components/ui";
import GlassCard from "@/components/ui/GlassCard";

export default function ProfilePage() {
  const { user, profile, signIn, signUp, signOut, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const { role, error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError);
        setSubmitting(false);
        return;
      }

      setSubmitting(false);

      if (role === "admin") router.push("/admin/dashboard");
      else if (role === "staff") router.push("/kitchen");
      else router.push("/");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const { role: newRole, error: signUpError } = await signUp(email, password, name);

      if (signUpError) {
        setError(signUpError);
        setSubmitting(false);
        return;
      }

      if (newRole) {
        setSubmitting(false);
        if (newRole === "admin") router.push("/admin/dashboard");
        else if (newRole === "staff") router.push("/kitchen");
        else router.push("/");
        return;
      }

      setSuccess(true);
      setSubmitting(false);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <p className="text-foreground/50">Loading...</p>
      </div>
    );
  }

  if (user && profile) {
    return (
      <div className="min-h-screen bg-[#050505] pt-28 sm:pt-32">
        <div className="max-w-md mx-auto px-4 pb-20">
          <GlassCard className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-gold" />
            </div>
            <h1 className="font-heading text-2xl text-foreground">{profile.name || "Customer"}</h1>
            <p className="text-sm text-foreground/50">{profile.email.replace(/(.{3})(.*)(@.*)/, "$1***$3")}</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold uppercase tracking-wider">
              {profile.role}
            </span>
            <div className="pt-4 space-y-2">
              <Button variant="secondary" className="w-full" onClick={() => router.push("/order/track")}>
                Track Order
              </Button>
              <Button variant="outline" className="w-full" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4">
        <GlassCard className="text-center max-w-md">
          <div className="text-5xl mb-4 text-green-400">✓</div>
          <h1 className="font-heading text-2xl text-gold mb-2">Account Created!</h1>
          <p className="text-foreground/60 mb-6">
            Check your email to confirm your account. You can now sign in.
          </p>
          <Button variant="primary" onClick={() => { setSuccess(false); setTab("signin"); }}>
            Sign In
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-28 sm:pt-32">
      <div className="max-w-md mx-auto px-4 pb-20">
        <div className="text-center mb-8">
          <User className="w-10 h-10 text-gold mx-auto mb-3" />
          <h1 className="font-heading text-2xl text-foreground">
            {tab === "signin" ? "Sign In" : "Sign Up"}
          </h1>
          <p className="text-sm text-foreground/50 mt-1">
            {tab === "signin"
              ? "Sign in with your email and password"
              : "Create an account to save your favorites and track orders."}
          </p>
        </div>

        <div className="flex mb-6 border border-white/10 rounded-lg overflow-hidden">
          <button
            onClick={() => setTab("signin")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "signin"
                ? "bg-gold text-background"
                : "bg-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "signup"
                ? "bg-gold text-background"
                : "bg-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        <GlassCard>
          <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
            {tab === "signup" && (
              <Input
                id="name"
                label="Name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-foreground/80">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={tab === "signup" ? "Create a password" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0A0A0A] pl-4 pr-10 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={submitting}>
              {tab === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}



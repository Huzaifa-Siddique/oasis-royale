"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { 
  User, 
  Eye, 
  EyeOff, 
  ShoppingBag, 
  Heart, 
  Settings, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  TrendingUp,
  MapPin,
  FileText
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import GlassCard from "@/components/ui/GlassCard";
import { formatPrice, cn } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { authHeaders } from "@/lib/api-fetch";
import { getSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";

type TabType = "orders" | "favorites" | "settings";

export default function ProfilePage() {
  const { user, profile, signIn, signUp, signOut, loading } = useAuth();
  const router = useRouter();
  const { addItem } = useCart();
  
  // Auth Form State
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Dashboard State
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [dishes, setDishes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Profile Edit State
  const [editName, setEditName] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Initialize edit name when profile loads
  useEffect(() => {
    if (profile?.name) {
      setEditName(profile.name);
    }
  }, [profile]);

  // Fetch orders, favorites and dishes
  const fetchDashboardData = useCallback(async () => {
    if (!user || !profile) return;
    setLoadingData(true);
    try {
      const headers = { ...authHeaders() };

      // 1. Fetch public dishes to match favorites details
      const dishesRes = await fetch("/api/dishes");
      const dishesData = dishesRes.ok ? await dishesRes.json() : [];
      setDishes(dishesData);

      // 2. Fetch favorites list
      const favoritesRes = await fetch("/api/favorites", { headers });
      const favoritesData = favoritesRes.ok ? await favoritesRes.json() : [];
      setFavorites((favoritesData || []).map((fav: any) => fav.dish_id));

      // 3. Fetch order history
      const ordersRes = await fetch(`/api/orders?user_id=${profile.id}`, { headers });
      const ordersData = ordersRes.ok ? await ordersRes.json() : [];
      setOrders(ordersData || []);

    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (user && profile) {
      fetchDashboardData();
    }
  }, [user, profile, fetchDashboardData]);

  // Handle Reorder Click
  const handleReorder = useCallback((itemsList: any[]) => {
    if (!itemsList || itemsList.length === 0) return;
    try {
      itemsList.forEach((item) => {
        for (let i = 0; i < item.quantity; i++) {
          addItem(item.dish_id);
        }
      });
      toast.success("Added items to your cart!");
      router.push("/order");
    } catch (err) {
      toast.error("Could not process reorder");
    }
  }, [addItem, router]);

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setUpdatingProfile(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase client not initialized");
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ name: editName.trim() })
        .eq("id", profile?.id);

      if (updateError) throw updateError;
      
      setProfileSuccess("Name updated successfully!");
      toast.success("Profile updated");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Sign In Handler
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
      else router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  // Sign Up Handler
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
        else router.refresh();
        return;
      }

      setSuccess(true);
      setSubmitting(false);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  // Filter dishes to get only favorited ones
  const favoritedDishes = useMemo(() => {
    return dishes.filter((dish) => favorites.includes(dish.id));
  }, [dishes, favorites]);

  // Order Status formatting
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">Pending</span>;
      case "processing":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-400/10 text-blue-400 border border-blue-400/20">Processing</span>;
      case "ready":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-green-400/10 text-green-400 border border-green-400/20">Ready for Pickup</span>;
      case "completed":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-foreground/40 border border-white/10">Completed</span>;
      case "cancelled":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-400/10 text-red-400 border border-red-400/20">Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-foreground/50 border border-white/5">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <p className="text-foreground/50 animate-pulse font-heading tracking-widest uppercase text-xs">Loading profile data...</p>
      </div>
    );
  }

  // LOGGED IN USER VIEW
  if (user && profile) {
    return (
      <div className="min-h-screen bg-[#050505] pt-28 sm:pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar with user info */}
            <div className="lg:col-span-1 space-y-6">
              <GlassCard className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto border border-gold/20 shadow-lg shadow-gold/5">
                  <User className="w-10 h-10 text-gold" />
                </div>
                <div>
                  <h2 className="font-heading text-xl text-foreground truncate">{profile.name || "Valued Customer"}</h2>
                  <p className="text-xs text-foreground/40 truncate mt-1">{profile.email}</p>
                </div>
                <div className="flex justify-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-medium bg-gold/10 text-gold uppercase tracking-wider border border-gold/20">
                    {profile.role}
                  </span>
                </div>
                
                <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all text-left",
                      activeTab === "orders" 
                        ? "bg-gold/20 text-gold border border-gold/30" 
                        : "text-foreground/60 hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Order History
                  </button>
                  <button
                    onClick={() => setActiveTab("favorites")}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all text-left",
                      activeTab === "favorites" 
                        ? "bg-gold/20 text-gold border border-gold/30" 
                        : "text-foreground/60 hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <Heart className="w-4 h-4" />
                    My Favorites
                  </button>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all text-left",
                      activeTab === "settings" 
                        ? "bg-gold/20 text-gold border border-gold/30" 
                        : "text-foreground/60 hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <Settings className="w-4 h-4" />
                    Account Settings
                  </button>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <button
                    onClick={signOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-all border border-red-500/10 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </GlassCard>
            </div>

            {/* Main content grid */}
            <div className="lg:col-span-3">
              
              {/* TAB 1: ORDER HISTORY */}
              {activeTab === "orders" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h1 className="font-heading text-xl md:text-2xl text-foreground">Order History</h1>
                    <span className="text-xs text-foreground/45 font-mono">{orders.length} orders</span>
                  </div>

                  {loadingData ? (
                    <div className="py-20 text-center text-foreground/40">Loading order log...</div>
                  ) : orders.length === 0 ? (
                    <GlassCard className="text-center py-16 space-y-4">
                      <ShoppingBag className="w-12 h-12 text-foreground/20 mx-auto" />
                      <h3 className="font-heading text-sm text-foreground/60">No orders found</h3>
                      <p className="text-xs text-foreground/40 max-w-sm mx-auto">
                        You haven't placed any orders yet. Visit our interactive menu to order with 3D views.
                      </p>
                      <Button variant="primary" size="sm" onClick={() => router.push("/menu")}>
                        Go to Menu
                      </Button>
                    </GlassCard>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <GlassCard key={order.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover:border-gold/30 transition-all">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-heading text-gold">#{order.order_short_id}</span>
                              {getStatusBadge(order.status)}
                            </div>
                            
                            <p className="text-xs text-foreground/40">
                              Placed on {new Date(order.created_at).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>

                            <div className="flex flex-col gap-2 pt-1">
                              {order.items.map((item: any, idx: number) => {
                                const customsPrice = (item.customizations || []).reduce((s: number, c: any) => s + c.price, 0);
                                return (
                                  <div key={idx} className="text-xs flex flex-col text-foreground/75 bg-white/5 px-3 py-1.5 rounded border border-white/5 max-w-md">
                                    <div className="flex justify-between">
                                      <span>{item.name} <span className="text-gold font-semibold">x{item.quantity}</span></span>
                                      <span className="text-foreground/45">{formatPrice((item.price + customsPrice) * item.quantity)}</span>
                                    </div>
                                    {item.customizations && item.customizations.length > 0 && (
                                      <span className="text-[10px] text-foreground/40 mt-0.5 ml-2 font-mono">
                                        Add-ons: {item.customizations.map((c: any) => `${c.name}`).join(", ")}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {order.special_instructions && (
                              <div className="text-[10px] text-amber-400 font-mono mt-1.5 bg-amber-500/5 border border-amber-500/10 px-2.5 py-1 rounded w-fit">
                                Note: "{order.special_instructions}"
                              </div>
                            )}
                          </div>

                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 pt-4 md:pt-0 border-t md:border-0 border-white/5">
                            <div>
                              <span className="text-[10px] text-foreground/40 block tracking-wider uppercase text-right">Total Price</span>
                              <span className="font-heading text-gold text-lg">{formatPrice(order.total)}</span>
                            </div>

                            <div className="flex gap-2">
                              {/* Reorder Button */}
                              <button
                                onClick={() => handleReorder(order.items)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold text-background font-heading text-[10px] tracking-wider uppercase font-bold hover:bg-gold/90 transition-all cursor-pointer shadow-lg shadow-gold/5"
                                title="Add all items in this order to cart"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reorder
                              </button>
                              
                              {/* Track order if active */}
                              {["pending", "processing", "ready"].includes(order.status) && (
                                <button
                                  onClick={() => {
                                    localStorage.setItem("oasis_order_uuid", order.id);
                                    router.push("/order/track");
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-foreground/80 font-heading text-[10px] tracking-wider uppercase transition-all cursor-pointer"
                                >
                                  Track
                                </button>
                              )}
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MY FAVORITES */}
              {activeTab === "favorites" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h1 className="font-heading text-xl md:text-2xl text-foreground">My Favorites</h1>
                    <span className="text-xs text-foreground/45 font-mono">{favorites.length} favorited</span>
                  </div>

                  {loadingData ? (
                    <div className="py-20 text-center text-foreground/40">Loading favorites...</div>
                  ) : favoritedDishes.length === 0 ? (
                    <GlassCard className="text-center py-16 space-y-4">
                      <Heart className="w-12 h-12 text-foreground/20 mx-auto" />
                      <h3 className="font-heading text-sm text-foreground/60">No favorites yet</h3>
                      <p className="text-xs text-foreground/40 max-w-sm mx-auto">
                        Tap the heart icon next to dishes on the menu to add them here for quick access.
                      </p>
                      <Button variant="primary" size="sm" onClick={() => router.push("/menu")}>
                        View Menu
                      </Button>
                    </GlassCard>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {favoritedDishes.map((dish) => (
                        <GlassCard key={dish.id} className="p-4 flex gap-4 hover:border-gold/30 transition-all items-center">
                          {dish.image_url ? (
                            <img
                              src={dish.image_url}
                              alt={dish.name}
                              className="w-20 h-20 rounded-xl object-cover border border-white/10 bg-black"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                              🍽️
                            </div>
                          )}
                          <div className="flex-1 min-w-0 space-y-1">
                            <h3 className="font-heading text-sm text-foreground truncate">{dish.name}</h3>
                            <p className="text-gold text-xs font-semibold">{formatPrice(dish.price)}</p>
                            <p className="text-[11px] text-foreground/40 line-clamp-1">{dish.description}</p>
                            
                            <div className="pt-2 flex gap-2">
                              <button
                                onClick={() => {
                                  addItem(dish.id);
                                  toast.success(`Added ${dish.name} to cart`);
                                }}
                                className="px-2 py-1 rounded bg-gold text-background font-heading text-[9px] tracking-wider uppercase font-bold hover:bg-gold/90 transition-all cursor-pointer"
                              >
                                Add to Cart
                              </button>
                              <button
                                onClick={() => router.push("/menu")}
                                className="px-2 py-1 rounded bg-white/5 border border-white/5 text-foreground/60 font-heading text-[9px] tracking-wider uppercase hover:bg-white/10 hover:text-foreground transition-all cursor-pointer"
                              >
                                View Menu
                              </button>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ACCOUNT SETTINGS */}
              {activeTab === "settings" && (
                <div className="space-y-6">
                  <div className="border-b border-white/5 pb-4">
                    <h1 className="font-heading text-xl md:text-2xl text-foreground">Account Settings</h1>
                  </div>

                  <GlassCard className="p-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <h3 className="font-heading text-sm uppercase text-gold tracking-wider border-b border-white/5 pb-2">Profile Information</h3>
                      
                      <Input
                        id="profile-email"
                        label="Email Address (Cannot be modified)"
                        type="email"
                        value={profile.email}
                        disabled
                        className="opacity-50"
                      />

                      <Input
                        id="profile-name"
                        label="Your Name"
                        type="text"
                        placeholder="Update display name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />

                      {profileError && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                          {profileError}
                        </div>
                      )}

                      {profileSuccess && (
                        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400">
                          {profileSuccess}
                        </div>
                      )}

                      <Button type="submit" loading={updatingProfile} className="w-full md:w-auto">
                        Save Changes
                      </Button>
                    </form>
                  </GlassCard>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  }

  // SIGN IN / SIGN UP AUTH VIEWS
  return (
    <div className="min-h-screen bg-[#050505] pt-28 sm:pt-32">
      <div className="max-w-md mx-auto px-4 pb-20">
        <div className="text-center mb-8">
          <User className="w-10 h-10 text-gold mx-auto mb-3" />
          <h1 className="font-heading text-2xl text-foreground">
            {authTab === "signin" ? "Sign In" : "Sign Up"}
          </h1>
          <p className="text-sm text-foreground/50 mt-1">
            {authTab === "signin"
              ? "Sign in with your email and password"
              : "Create an account to save your favorites and track orders."}
          </p>
        </div>

        <div className="flex mb-6 border border-white/10 rounded-lg overflow-hidden">
          <button
            onClick={() => setAuthTab("signin")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              authTab === "signin"
                ? "bg-gold text-background font-semibold"
                : "bg-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setAuthTab("signup")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              authTab === "signup"
                ? "bg-gold text-background font-semibold"
                : "bg-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        {success ? (
          <GlassCard className="text-center">
            <div className="text-5xl mb-4 text-green-400">✓</div>
            <h1 className="font-heading text-xl text-gold mb-2">Account Created!</h1>
            <p className="text-foreground/60 text-xs mb-6">
              Check your email to confirm your account. You can now sign in.
            </p>
            <Button variant="primary" onClick={() => { setSuccess(false); setAuthTab("signin"); }}>
              Sign In
            </Button>
          </GlassCard>
        ) : (
          <GlassCard>
            <form onSubmit={authTab === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
              {authTab === "signup" && (
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
                    placeholder={authTab === "signup" ? "Create a password" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0A0A0A] pl-4 pr-10 py-2.5 text-sm text-foreground placeholder:text-foreground/45 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all"
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
                {authTab === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

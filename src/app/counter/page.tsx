"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatPrice } from "@/lib/utils";
import type { Dish, OrderItem, Tags } from "@/lib/supabase-types";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Clock,
  User,
  Tag,
  Star,
  Send,
  Search,
  CheckCircle,
  Volume2,
  VolumeX,
  Smartphone,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { getSupabaseClient } from "@/lib/supabase";
import type { Order } from "@/lib/supabase-types";
import { useAuth } from "@/lib/auth-context";
import { useOrderSound } from "@/hooks/useOrderSound";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import RealtimeBanner from "@/components/ui/RealtimeBanner";

type CartItem = OrderItem & { dish_id: string };

const TAG_OPTIONS: { value: Tags; label: string }[] = [
  { value: "No Mobile Customer", label: "No Mobile" },
  { value: "Walk-in", label: "Walk-in" },
  { value: "Large Group", label: "Large Group" },
];

function CounterContent() {
  const { accessToken, profile } = useAuth();
  const getHeaders = useCallback((): Record<string, string> => {
    const h: Record<string, string> = {};
    if (accessToken) h.Authorization = `Bearer ${accessToken}`;
    return h;
  }, [accessToken]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableId, setTableId] = useState("walk-in");
  const [selectedTags, setSelectedTags] = useState<Tags[]>(["Walk-in"]);
  const [priority, setPriority] = useState<"normal" | "vip">("normal");
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [category, setCategory] = useState<string>("all");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"new" | "pending">("new");
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingLoading, setPendingLoading] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<string | null>(null);
  const [restaurantOpen, setRestaurantOpen] = useState<boolean | null>(null);
  const { playBeep, soundEnabled, toggleSound } = useOrderSound();
  const [tables, setTables] = useState<{id: string; name: string}[]>([]);
  const [editingEtaOrderId, setEditingEtaOrderId] = useState<string | null>(null);
  const [editingEtaValue, setEditingEtaValue] = useState(15);

  const [activeActionOrder, setActiveActionOrder] = useState<Order | null>(null);
  const [actionType, setActionType] = useState<"pay" | "cancel" | null>(null);
  const [selectedEta, setSelectedEta] = useState<number>(15);
  const [cancelReason, setCancelReason] = useState<string>("customer_cancelled");
  const [customCancelReason, setCustomCancelReason] = useState<string>("");

  // Customization Negotiation States
  const [proposingCustomizationOrder, setProposingCustomizationOrder] = useState<Order | null>(null);
  const [customizationChargeInput, setCustomizationChargeInput] = useState("");
  const [customizationNotesInput, setCustomizationNotesInput] = useState("");

  const handleApproveCustomizationFree = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({
          customization_status: "approved",
          customization_charge: 0.00,
        }),
      });
      if (res.ok) {
        toast.success("Customization approved for free!");
        fetchPendingOrders();
      }
    } catch {
      alert("Failed to approve customization");
    }
  };

  const handleProposeCustomizationCharge = async () => {
    if (!proposingCustomizationOrder) return;
    const orderId = proposingCustomizationOrder.id;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({
          customization_status: "proposed",
          customization_charge: Number(customizationChargeInput) || 0.00,
          customization_notes: customizationNotesInput || null,
        }),
      });
      if (res.ok) {
        toast.success("Extra charge proposal sent to customer!");
        setProposingCustomizationOrder(null);
        setCustomizationChargeInput("");
        setCustomizationNotesInput("");
        fetchPendingOrders();
      }
    } catch {
      alert("Failed to propose customization charge");
    }
  };

  const handleConfirmPay = async () => {
    if (!activeActionOrder) return;
    const orderId = activeActionOrder.id;
    setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
    setActiveActionOrder(null);
    setActionType(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({ 
          status: "processing",
          estimated_minutes: selectedEta,
          estimated_minutes_set_by: "counter",
        }),
      });
      if (!res.ok) fetchPendingOrders();
    } catch {
      fetchPendingOrders();
    }
    fetchPendingOrders();
  };

  const handleConfirmCancel = async () => {
    if (!activeActionOrder) return;
    const orderId = activeActionOrder.id;
    const reason = cancelReason === "other" ? customCancelReason : cancelReason;
    if (!reason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }
    setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
    setActiveActionOrder(null);
    setActionType(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({ 
          status: "cancelled",
          cancellation: {
            reason,
            cancelled_by: "counter",
            cancelled_at: new Date().toISOString(),
          }
        }),
      });
      if (!res.ok) fetchPendingOrders();
    } catch {
      fetchPendingOrders();
    }
    fetchPendingOrders();
  };

  const fetchPendingOrders = useCallback(async () => {
    try {
      setPendingLoading(true);
      const res = await fetch("/api/orders?source=qr&status=pending", { headers: { ...getHeaders() } });
      const data = await res.json();
      if (Array.isArray(data)) {
        setPendingOrders(data);
      }
    } catch {} finally {
      setPendingLoading(false);
    }
  }, [getHeaders]);

  const fetchRestaurantStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/restaurant-status", { headers: { ...getHeaders() } });
      const data = await res.json();
      if (typeof data.is_open === "boolean") setRestaurantOpen(data.is_open);
    } catch {}
  }, [getHeaders]);

  const toggleRestaurantStatus = async () => {
    if (restaurantOpen === null) return;
    try {
      const newStatus = !restaurantOpen;
      const res = await fetch("/api/restaurant-status", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({ is_open: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.is_open === "boolean") {
          setRestaurantOpen(data.is_open);
        } else {
          setRestaurantOpen(newStatus);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("Toggle error:", res.status, err);
        alert(`Failed to update restaurant status: ${err.error || `HTTP ${res.status}`}`);
      }
    } catch (err) {
      console.error("Toggle error:", err);
      alert("Network error. Check connection.");
    }
  };

  useEffect(() => {
    fetchPendingOrders();
    fetchRestaurantStatus();
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel("counter-pending")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const order = payload.new as Order;
          if (order.status === "pending" && order.source === "qr") {
            setPendingOrders((prev) => {
              if (prev.some((o) => o.id === order.id)) return prev;
              if (order.customization_status === "pending_approval") {
                playBeep(880, 0.2);
                setTimeout(() => playBeep(880, 0.4), 200);
              } else {
                playBeep(660, 0.3);
              }
              return [order, ...prev];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updated = payload.new as Order;
          setPendingOrders((prev) => {
            const existing = prev.find((o) => o.id === updated.id);
            if (updated.status === "pending" && updated.customization_status === "pending_approval" && existing?.customization_status !== "pending_approval") {
              playBeep(880, 0.2);
              setTimeout(() => playBeep(880, 0.4), 200);
            }
            if (!prev.some((o) => o.id === updated.id)) {
              return (updated.status === "pending" && updated.source === "qr") ? [updated, ...prev] : prev;
            }
            if (updated.status !== "pending") return prev.filter((o) => o.id !== updated.id);
            return prev.map((o) => (o.id === updated.id ? updated : o));
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "orders" },
        (payload) => {
          const deleted = payload.old as Order;
          setPendingOrders((prev) => prev.filter((o) => o.id !== deleted.id));
        }
      )
      .subscribe((status) => setRealtimeStatus(status));

    const pollInterval = setInterval(fetchPendingOrders, 30000);
    return () => {
      channel.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [fetchPendingOrders, playBeep]);

  const filteredPending = useMemo(() => {
    if (!pendingSearch.trim()) return pendingOrders;
    const term = pendingSearch.trim().toLowerCase();
    return pendingOrders.filter(
      (o) =>
        o.order_short_id.toString().includes(term) ||
        (o.table_id || "walk-in").toLowerCase().includes(term)
    );
  }, [pendingOrders, pendingSearch]);


  useEffect(() => {
    fetch("/api/tables")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTables(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/dishes", { headers: { ...getHeaders() } })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDishes(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(dishes.map((d) => d.category));
    return ["all", ...Array.from(cats)];
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    if (category === "all") return dishes;
    return dishes.filter((d) => d.category === category);
  }, [dishes, category]);

  const addToCart = (dish: Dish) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dish_id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish_id === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          dish_id: dish.id,
          name: dish.name,
          quantity: 1,
          price: dish.price,
        },
      ];
    });
  };

  const updateQty = (dishId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.dish_id === dishId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (dishId: string) => {
    setCart((prev) => prev.filter((item) => item.dish_id !== dishId));
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const toggleTag = (tag: Tags) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setOrderError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({
          table_id: tableId,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          source: "counter",
          items: cart,
          total,
          tags: selectedTags,
          priority,
          estimated_minutes: estimatedMinutes,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else if (res.status === 503) {
        const body = await res.json().catch(() => ({}));
        setOrderError(body.error || "Restaurant is closed. New orders cannot be placed.");
      } else {
        const body = await res.json().catch(() => ({}));
        setOrderError(body.error || `Request failed (${res.status})`);
      }
    } catch (err) {
      console.error("Counter order error:", err);
      setOrderError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#050505]">
        <GlassCard className="text-center max-w-md mx-6">
          <div className="text-5xl mb-4 text-green-400">✓</div>
          <h1 className="font-heading text-2xl text-gold mb-2">
            Order Placed!
          </h1>
          <p className="text-foreground/60 mb-6">
            Order sent to the kitchen. Estimated{" "}
            <span className="text-gold">{estimatedMinutes} min</span>.
          </p>
          <Button
            variant="primary"
            onClick={() => {
              setSubmitted(false);
              setCart([]);
              setCustomerName("");
              setCustomerPhone("");
              setSelectedTags(["Walk-in"]);
              setPriority("normal");
              setOrderError(null);
            }}
          >
            New Order
          </Button>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4 pt-28 pb-6">
        <RealtimeBanner status={realtimeStatus} />
          {restaurantOpen === false && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-between">
              <span className="text-amber-400 text-sm font-medium">
                Restaurant is currently CLOSED. New orders are blocked (503). Existing orders can still be paid.
              </span>
              <button
                onClick={toggleRestaurantStatus}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
              >
                Open Restaurant
              </button>
            </div>
          )}
          {restaurantOpen === true && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/15 border border-green-500/30 flex items-center justify-between">
              <span className="text-green-400 text-sm font-medium">
                Restaurant is OPEN. Accepting new orders.
              </span>
              <button
                onClick={toggleRestaurantStatus}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors"
              >
                Close Restaurant
              </button>
            </div>
          )}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-7 h-7 text-gold" />
            <h1 className="font-heading text-2xl text-foreground">Counter Order</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-foreground/40">Oasis Royale Staff</span>
            <button
              onClick={toggleRestaurantStatus}
              disabled={restaurantOpen === null}
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                restaurantOpen === null
                  ? "opacity-50 cursor-not-allowed"
                  : restaurantOpen
                  ? "bg-green-500/20 hover:bg-green-500/30"
                  : "bg-amber-500/20 hover:bg-amber-500/30"
              }`}
              title={restaurantOpen === null ? "Loading..." : restaurantOpen ? "Close Restaurant" : "Open Restaurant"}
              style={{ width: '44px', height: '28px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '2px' }}
            >
              {restaurantOpen === null ? (
                <span className="w-3.5 h-3.5 text-foreground/30 animate-pulse">?</span>
              ) : (
                <span className={`w-6 h-6 rounded-full transition-transform duration-200 ${restaurantOpen ? 'translate-x-4 bg-green-400' : 'translate-x-0 bg-amber-400'}`} />
              )}
            </button>
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              title={soundEnabled ? "Mute" : "Unmute"}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-gold" /> : <VolumeX className="w-3.5 h-3.5 text-foreground/30" />}
            </button>
          </div>
        </div>

          <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1 w-fit">
            <button
              onClick={() => setViewMode("new")}
              className={`px-5 py-2 rounded-md text-sm font-heading transition-all ${
                viewMode === "new"
                  ? "bg-gold text-background"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              New Order
            </button>
            <button
              onClick={() => setViewMode("pending")}
              className={`px-5 py-2 rounded-md text-sm font-heading transition-all ${
                viewMode === "pending"
                  ? "bg-gold text-background"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Pending Orders ({pendingOrders.length})
            </button>
          </div>

          {viewMode === "new" ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* LEFT: Menu */}
              <div className="xl:col-span-2 space-y-4">
                {/* Category tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`shrink-0 px-4 py-2 rounded-lg text-xs font-heading uppercase tracking-wider transition-all ${
                        category === cat
                          ? "bg-gold text-background"
                          : "bg-white/5 text-foreground/60 hover:bg-white/10"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <p className="text-foreground/40 text-sm">Loading menu...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredDishes.map((dish) => (
                      <button
                        key={dish.id}
                        onClick={() => addToCart(dish)}
                        disabled={!dish.is_available}
                        className="glassmorphism rounded-xl p-4 text-left transition-all duration-200
                          hover:border-gold/30 active:scale-[0.98]
                          disabled:opacity-40 disabled:cursor-not-allowed text-left"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-heading text-sm text-foreground truncate pr-2">
                            {dish.name}
                          </h3>
                          <span className="text-gold text-xs font-heading shrink-0">
                            {formatPrice(dish.price)}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/40 line-clamp-1">
                          {dish.description || dish.category}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Cart + Order Form */}
              <div className="space-y-4">
                {/* Customer Info */}
                <GlassCard className="space-y-3 !p-4">
                  <h2 className="font-heading text-sm text-gold uppercase tracking-wider">
                    Customer
                  </h2>
                  <Input
                    placeholder="Customer name (optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  <select
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm text-foreground focus:border-gold/50 focus:outline-none transition-all"
                  >
                    <option value="walk-in">Walk-in (No Table)</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {!selectedTags.includes("No Mobile Customer") && (
                    <div>
                      <Input
                        type="tel"
                        placeholder="WhatsApp number for dispatch"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                      <p className="text-[10px] text-foreground/30 mt-1">
                        <Smartphone className="w-2.5 h-2.5 inline mr-0.5" />
                        Used to notify customer when ready
                      </p>
                    </div>
                  )}
                  {selectedTags.includes("No Mobile Customer") && (
                    <p className="text-xs text-amber-400/70">No WhatsApp — customer will collect manually</p>
                  )}
                </GlassCard>

                {/* Tags + Priority */}
                <GlassCard className="space-y-3 !p-4">
                  <div className="flex items-center gap-2 text-xs text-foreground/60 uppercase tracking-wider">
                    <Tag className="w-3 h-3" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TAG_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => toggleTag(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedTags.includes(opt.value)
                            ? "bg-gold/20 text-gold border border-gold/30"
                            : "bg-white/5 text-foreground/50 border border-white/5 hover:bg-white/10"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Star className="w-3 h-3 text-foreground/40" />
                    <button
                      onClick={() =>
                        setPriority(priority === "normal" ? "vip" : "normal")
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        priority === "vip"
                          ? "bg-gold/20 text-gold border border-gold/30"
                          : "bg-white/5 text-foreground/50 border border-white/5"
                      }`}
                    >
                      {priority === "vip" ? "★ VIP" : "Normal"}
                    </button>
                  </div>
                </GlassCard>

                {/* Estimated time */}
                <GlassCard className="space-y-2 !p-4">
                  <div className="flex items-center gap-2 text-xs text-foreground/60 uppercase tracking-wider">
                    <Clock className="w-3 h-3" />
                    Est. Time
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={5}
                      max={60}
                      step={5}
                      value={estimatedMinutes}
                      onChange={(e) =>
                        setEstimatedMinutes(Number(e.target.value))
                      }
                      className="flex-1 accent-gold"
                    />
                    <span className="text-sm text-gold font-heading w-12 text-right">
                      {estimatedMinutes}m
                    </span>
                  </div>
                </GlassCard>

                {/* Cart */}
                <GlassCard className="space-y-3 !p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-sm text-gold uppercase tracking-wider">
                      Order
                    </h2>
                    <span className="text-xs text-foreground/40">
                      {cart.length} item{cart.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {cart.length === 0 ? (
                    <p className="text-xs text-foreground/30 text-center py-4">
                      Tap menu items to add
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div
                          key={item.dish_id}
                          className="flex items-center gap-2 bg-white/5 rounded-lg p-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground truncate">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-foreground/40">
                              {formatPrice(item.price)} each
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQty(item.dish_id, -1)}
                              className="p-1.5 sm:p-2.5 rounded hover:bg-white/10 transition-colors"
                            >
                              <Minus className="w-4 h-4 text-foreground/60" />
                            </button>
                            <span className="w-6 text-center text-xs font-medium text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.dish_id, 1)}
                              className="p-1.5 sm:p-2.5 rounded hover:bg-white/10 transition-colors"
                            >
                              <Plus className="w-4 h-4 text-foreground/60" />
                            </button>
                          </div>
                          <span className="text-xs text-gold w-14 text-right">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeItem(item.dish_id)}
                            className="p-1.5 sm:p-2.5 rounded hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-400/60" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {cart.length > 0 && (
                    <>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-xs text-foreground/60">Total</span>
                        <span className="font-heading text-base text-gold">
                          {formatPrice(total)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-foreground/30">
                          <Clock className="w-3 h-3" />
                          {estimatedMinutes} min
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-foreground/30">
                          <User className="w-3 h-3" />
                          {customerName || "Walk-in"}
                        </div>
                      </div>

                      {orderError && (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                          <p className="text-red-400 text-xs">{orderError}</p>
                          <button onClick={() => setOrderError(null)} className="text-xs text-gold mt-1">
                            Try Again
                          </button>
                        </div>
                      )}

                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full mt-1"
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        disabled={isSubmitting || cart.length === 0}
                      >
                        <Send className="w-4 h-4" />
                        Submit to Kitchen
                      </Button>
                    </>
                  )}
                </GlassCard>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                <Input
                  placeholder="Search by order # or table..."
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {pendingLoading && pendingOrders.length === 0 ? (
                <p className="text-foreground/40 text-sm">Loading pending orders...</p>
              ) : filteredPending.length === 0 ? (
                <p className="text-foreground/30 text-sm text-center py-12">
                  {pendingSearch ? "No orders match your search" : "No pending payments"}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPending.map((order) => (
                    <GlassCard key={order.id} className="space-y-3 !p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-lg text-gold">#{order.order_short_id}</span>
                        <span className="text-xs text-foreground/40">Table {order.table_id}</span>
                      </div>
                      {order.customer_name && (
                        <p className="text-xs text-foreground/50">{order.customer_name}</p>
                      )}
                      {editingEtaOrderId === order.id ? (
                        <div className="flex items-center gap-1 mb-2">
                          <input
                            type="number"
                            min={5}
                            max={120}
                            value={editingEtaValue}
                            onChange={(e) => setEditingEtaValue(Math.max(5, Number(e.target.value)))}
                            className="w-16 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-foreground text-center"
                            autoFocus
                          />
                          <button
                            onClick={async () => {
                              await fetch(`/api/orders/${order.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json", ...getHeaders() },
                                body: JSON.stringify({
                                  estimated_minutes: editingEtaValue,
                                  estimated_minutes_set_by: "counter",
                                }),
                              });
                              setEditingEtaOrderId(null);
                              fetchPendingOrders();
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gold/20 text-gold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingEtaOrderId(null)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-foreground/50"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingEtaOrderId(order.id);
                            setEditingEtaValue(order.estimated_minutes || 15);
                          }}
                          className="text-xs text-foreground/40 hover:text-gold transition-colors"
                        >
                          ~{order.estimated_minutes || 15}m
                        </button>
                      )}
                      {/* Customization negotiation panel badges */}
                      {order.customization_status === "pending_approval" && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg p-2 text-xs space-y-1">
                          <span className="font-semibold block text-[10px] uppercase">⌛ Custom Instructions Review:</span>
                          <p className="font-mono bg-black/40 p-1.5 rounded text-[11px] text-foreground/90">{order.special_instructions}</p>
                          {order.customization_notes && (
                            <p className="text-[10px] text-amber-300/80 italic">Customer Reply: "{order.customization_notes}"</p>
                          )}
                          <div className="flex gap-1.5 pt-1">
                            <button
                              onClick={() => handleApproveCustomizationFree(order.id)}
                              className="flex-1 py-1 rounded bg-green-500/25 border border-green-500/40 text-green-400 font-semibold text-[9px] uppercase cursor-pointer"
                            >
                              Approve Free
                            </button>
                            <button
                              onClick={() => {
                                setProposingCustomizationOrder(order);
                                setCustomizationChargeInput("");
                                setCustomizationNotesInput("");
                              }}
                              className="flex-1 py-1 rounded bg-gold/25 border border-gold/40 text-gold font-semibold text-[9px] uppercase cursor-pointer"
                            >
                              Charge Extra
                            </button>
                          </div>
                        </div>
                      )}
                      {order.customization_status === "proposed" && (
                        <div className="bg-gold/10 border border-gold/25 text-gold rounded-lg p-2 text-xs space-y-1">
                          <span className="font-semibold block text-[10px] uppercase">💬 Proposed Extra Charge:</span>
                          <p className="text-[10px] text-foreground/80">Proposed: +{formatPrice(order.customization_charge)}</p>
                          {order.customization_notes && (
                            <p className="text-[10px] text-foreground/50 italic">"Note: {order.customization_notes}"</p>
                          )}
                          <span className="block text-[9px] text-foreground/40 mt-1 animate-pulse">⌛ Awaiting customer acceptance...</span>
                        </div>
                      )}
                      {order.customization_status === "approved" && (
                        <div className="bg-green-500/10 border border-green-500/25 text-green-400 rounded-lg p-2 text-[10px] flex justify-between items-center">
                          <span>✓ Custom Request Approved</span>
                          {order.customization_charge > 0 && (
                            <span className="font-semibold font-mono">+{formatPrice(order.customization_charge)}</span>
                          )}
                        </div>
                      )}

                      <div className="space-y-1 pt-1.5">
                        {order.items.map((item: any) => {
                          const customsPrice = (item.customizations || []).reduce((s: number, c: any) => s + c.price, 0);
                          return (
                            <div key={item.dish_id} className="flex flex-col text-xs border-b border-white/5 pb-1 last:border-0 last:pb-0">
                              <div className="flex justify-between">
                                <span className="text-foreground/80">{item.quantity}x {item.name}</span>
                                <span className="text-foreground/60">{formatPrice((item.price + customsPrice) * item.quantity)}</span>
                              </div>
                              {item.customizations && item.customizations.length > 0 && (
                                <span className="text-[9px] text-foreground/45 ml-4 font-mono">
                                  Add-ons: {item.customizations.map((c: any) => `${c.name}`).join(", ")}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                        <span className="font-heading text-base text-gold shrink-0">{formatPrice(order.total)}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionOrder(order);
                              setActionType("cancel");
                              setCancelReason("customer_cancelled");
                              setCustomCancelReason("");
                            }}
                            className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-heading hover:bg-red-500/10 transition-colors"
                          >
                            Cancel
                          </button>
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => {
                              setActiveActionOrder(order);
                              setActionType("pay");
                              setSelectedEta(order.estimated_minutes || 15);
                            }}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Paid
                          </Button>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          )}
      </div>

      {/* Modals for Payment Confirmation (ETA) & Order Cancellation */}
      {activeActionOrder && actionType === "pay" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#111111]">
              <h3 className="font-heading text-lg text-gold">Confirm Payment</h3>
              <button onClick={() => { setActiveActionOrder(null); setActionType(null); }} className="text-foreground/40 hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-foreground/80">
                You are marking order <strong className="text-gold">#{activeActionOrder.order_short_id}</strong> as paid. Please set the estimated preparation time for the kitchen:
              </p>
              
              <div className="space-y-2">
                <label className="text-xs text-foreground/40 block">Select Preparation Time (ETA):</label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 15, 20, 30, 45, 60].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSelectedEta(preset)}
                      className={`py-2 px-3 rounded-lg border text-xs font-heading transition-colors ${
                        selectedEta === preset
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-white/10 hover:border-white/20 text-foreground/75"
                      }`}
                    >
                      {preset} min
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-foreground/50">Custom time:</span>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={selectedEta}
                  onChange={(e) => setSelectedEta(Math.max(1, Number(e.target.value)))}
                  className="w-20 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground text-center focus:border-gold/50 focus:outline-none"
                />
                <span className="text-xs text-foreground/50">minutes</span>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setActiveActionOrder(null); setActionType(null); }}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 text-foreground/70 text-sm font-heading hover:bg-white/5 transition-colors"
                >
                  Dismiss
                </button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleConfirmPay}
                >
                  Confirm & Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeActionOrder && actionType === "cancel" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#111111]">
              <h3 className="font-heading text-lg text-red-400">Cancel Order</h3>
              <button onClick={() => { setActiveActionOrder(null); setActionType(null); }} className="text-foreground/40 hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-foreground/80">
                Are you sure you want to cancel order <strong className="text-gold">#{activeActionOrder.order_short_id}</strong>?
              </p>
              
              <div className="space-y-2">
                <label className="text-xs text-foreground/40 block">Select Cancellation Reason:</label>
                <div className="space-y-2">
                  {[
                    { value: "customer_cancelled", label: "Customer requested cancellation" },
                    { value: "out_of_stock", label: "Item out of stock" },
                    { value: "incorrect_order", label: "Incorrect order details" },
                    { value: "other", label: "Other reason" },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setCancelReason(r.value)}
                      className={`w-full text-left py-2 px-3 rounded-lg border text-xs transition-colors ${
                        cancelReason === r.value
                          ? "border-red-500 bg-red-500/10 text-red-400"
                          : "border-white/10 hover:border-white/20 text-foreground/75"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {cancelReason === "other" && (
                <textarea
                  placeholder="Please provide details..."
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value)}
                  className="w-full h-20 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-foreground placeholder:text-foreground/30 focus:border-red-500/55 focus:outline-none resize-none"
                />
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setActiveActionOrder(null); setActionType(null); }}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 text-foreground/70 text-sm font-heading hover:bg-white/5 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-heading hover:bg-red-700 transition-colors"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Proposing Customization Charge */}
      {proposingCustomizationOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#111111]">
              <h3 className="font-heading text-lg text-gold">Propose Custom Request Charge</h3>
              <button onClick={() => setProposingCustomizationOrder(null)} className="text-foreground/40 hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-foreground/80">
                Order <strong className="text-gold">#{proposingCustomizationOrder.order_short_id}</strong> requested customization:
              </p>
              <div className="bg-black/40 p-3 rounded-lg text-xs font-mono text-foreground/70">
                "{proposingCustomizationOrder.special_instructions}"
              </div>

              <div className="space-y-2">
                <label className="text-xs text-foreground/40 block">Propose Additional Charge (Subtotal):</label>
                <div className="flex items-center gap-2">
                  <span className="text-gold font-bold text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="3.00"
                    value={customizationChargeInput}
                    onChange={(e) => setCustomizationChargeInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground focus:border-gold/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-foreground/40 block">Reply Notes / Explanation to Customer:</label>
                <textarea
                  placeholder="e.g. Extra $3.00 for double beef patty and extra cheese."
                  value={customizationNotesInput}
                  onChange={(e) => setCustomizationNotesInput(e.target.value)}
                  className="w-full h-20 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-foreground placeholder:text-foreground/30 focus:border-gold/50 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setProposingCustomizationOrder(null)}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 text-foreground/70 text-sm font-heading hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleProposeCustomizationCharge}
                  className="flex-1 py-2.5 rounded-lg bg-gold text-background text-sm font-heading font-bold hover:bg-gold/90 transition-colors cursor-pointer"
                >
                  Send Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CounterPage() {
  return (
    <ProtectedRoute allowedRoles={["staff", "admin"]}>
      <CounterContent />
    </ProtectedRoute>
  );
}

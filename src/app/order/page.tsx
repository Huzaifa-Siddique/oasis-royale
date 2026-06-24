"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Trash2, Minus, Plus, Smartphone } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { authHeaders } from "@/lib/api-fetch";
import { toast } from "sonner";
import type { Dish } from "@/lib/supabase-types";
import { getSupabaseClient } from "@/lib/supabase";

type OrderData = {
  id: string;
  order_short_id: number;
  session_id: string;
  items: Array<{ dish_id: string; name: string; quantity: number; price: number }>;
  total: number;
  status: string;
  created_at: string;
  cancellation?: {
    reason: string;
    cancelled_by: string;
    cancelled_at: string;
  };
};

export default function OrderPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCart();

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [tableId, setTableId] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [kitchenWarning, setKitchenWarning] = useState(false);
  const [cancelCountdown, setCancelCountdown] = useState<number | null>(null);

  const [idempotencyKey] = useState(() => {
    if (typeof window === "undefined") return "";
    const existing = sessionStorage.getItem("order_idempotency_key");
    if (existing) return existing;
    const key = crypto.randomUUID();
    sessionStorage.setItem("order_idempotency_key", key);
    return key;
  });

  const [orderSessionId] = useState(() => {
    if (typeof window === "undefined") return "";
    const existing = localStorage.getItem("oasis_order_session_id");
    if (existing) return existing;
    const key = crypto.randomUUID();
    localStorage.setItem("oasis_order_session_id", key);
    return key;
  });

  useEffect(() => {
    const orderPlaced = localStorage.getItem("oasis_order_placed");
    const orderDataRaw = localStorage.getItem("oasis_order_data");
    const orderSessionId = localStorage.getItem("oasis_order_session_id");

    if (orderPlaced && orderDataRaw && orderSessionId) {
      try {
        const parsed = JSON.parse(orderDataRaw);
        setOrderData(parsed);
        setSubmitted(true);

        // Fetch latest status immediately
        fetch(`/api/orders?session_id=${orderSessionId}`)
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              const latestOrder = data[0];
              if (latestOrder.status === "completed" || latestOrder.status === "cancelled") {
                // Order is complete or cancelled, clear order details to let them place a new order
                localStorage.removeItem("oasis_order_data");
                localStorage.removeItem("oasis_order_placed");
                localStorage.removeItem("oasis_order_uuid");
                localStorage.removeItem("oasis_order_session_id");
                setOrderData(null);
                setSubmitted(false);
              } else {
                setOrderData(latestOrder);
                localStorage.setItem("oasis_order_data", JSON.stringify(latestOrder));
                if (latestOrder.status === "pending") {
                  const createdAt = new Date(latestOrder.created_at).getTime();
                  const remaining = Math.max(0, 30 - Math.floor((Date.now() - createdAt) / 1000));
                  if (remaining > 0) {
                    setCancelCountdown(remaining);
                  }
                }
              }
            }
          })
          .catch(() => {});
      } catch {}
    }

    const cookieMatch = document.cookie.match(/(?:^|;\s*)oasis_table_id=([^;]*)/);
    let tid = cookieMatch ? cookieMatch[1] : null;

    if (tid) {
      localStorage.setItem("oasis_table_id", tid);
    } else {
      tid = localStorage.getItem("oasis_table_id");
    }
    if (tid) setTableId(tid);
  }, []);

  useEffect(() => {
    fetch("/api/dishes", { headers: { ...authHeaders() } })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDishes(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      fetch("/api/kitchen/heartbeat")
        .then((r) => r.json())
        .then((data) => setKitchenWarning(!data.active))
        .catch(() => {});
      return;
    }

    const channel = supabase.channel("kitchen_status");
    let hasPresenceUpdated = false;

    const updateWarning = () => {
      hasPresenceUpdated = true;
      const state = channel.presenceState();
      const onlineStaff = Object.keys(state).length;
      setKitchenWarning(onlineStaff === 0);
    };

    channel
      .on("presence", { event: "sync" }, updateWarning)
      .on("presence", { event: "join" }, updateWarning)
      .on("presence", { event: "leave" }, updateWarning)
      .subscribe();

    const fallbackTimer = setTimeout(() => {
      if (!hasPresenceUpdated) {
        fetch("/api/kitchen/heartbeat")
          .then((r) => r.json())
          .then((data) => setKitchenWarning(!data.active))
          .catch(() => {});
      }
    }, 3000);

    return () => {
      channel.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    if (cancelCountdown === null) return;
    if (cancelCountdown <= 0) {
      setCancelCountdown(null);
      return;
    }
    const interval = setInterval(() => {
      setCancelCountdown((c) => {
        if (c === null || c <= 1) return null;
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cancelCountdown]);

  useEffect(() => {
    if (!submitted || !orderSessionId) return;

    let isMounted = true;

    const syncStatus = async () => {
      try {
        const res = await fetch(`/api/orders?session_id=${orderSessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && isMounted) {
          const latestOrder = data[0];
          if (latestOrder.status === "completed" || latestOrder.status === "cancelled") {
            // Clear order details
            localStorage.removeItem("oasis_order_data");
            localStorage.removeItem("oasis_order_placed");
            localStorage.removeItem("oasis_order_uuid");
            localStorage.removeItem("oasis_order_session_id");
            setOrderData(null);
            setSubmitted(false);
          } else {
            setOrderData(latestOrder);
            localStorage.setItem("oasis_order_data", JSON.stringify(latestOrder));
          }
        }
      } catch (err) {
        console.error("Error syncing order status:", err);
      }
    };

    const supabase = getSupabaseClient();
    let channel: any = null;

    if (supabase) {
      channel = supabase
        .channel(`order-sync-${orderSessionId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `session_id=eq.${orderSessionId}`,
          },
          (payload: any) => {
            if (isMounted) {
              const latestOrder = payload.new;
              if (latestOrder.status === "completed" || latestOrder.status === "cancelled") {
                localStorage.removeItem("oasis_order_data");
                localStorage.removeItem("oasis_order_placed");
                localStorage.removeItem("oasis_order_uuid");
                localStorage.removeItem("oasis_order_session_id");
                setOrderData(null);
                setSubmitted(false);
              } else {
                setOrderData(latestOrder);
                localStorage.setItem("oasis_order_data", JSON.stringify(latestOrder));
              }
            }
          }
        )
        .subscribe();
    } else {
      // Fallback: poll every 10 seconds
      const interval = setInterval(syncStatus, 10000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      isMounted = false;
      channel?.unsubscribe();
    };
  }, [submitted, orderSessionId]);

  const dishMap = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes]);

  const cartItems = useMemo(
    () =>
      items
        .map((item) => {
          const dish = dishMap.get(item.id);
          if (!dish) return null;
          return { id: item.id, name: dish.name, price: dish.price, quantity: item.quantity };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    [items, dishMap]
  );

  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setOrderError(null);

    try {
      const heartbeatRes = await fetch("/api/kitchen/heartbeat", { headers: { ...authHeaders() } });
      const heartbeatData = await heartbeatRes.json();
      if (!heartbeatData.active) setKitchenWarning(true);

      const dishesRes = await fetch("/api/dishes", { headers: { ...authHeaders() } });
      if (!dishesRes.ok) throw new Error("Failed to fetch dish prices");
      const freshDishes: Dish[] = await dishesRes.json();
      const freshMap = new Map(freshDishes.map((d) => [d.id, d]));

      const orderItems = items.map((item) => {
        const dish = freshMap.get(item.id);
        return {
          dish_id: item.id,
          name: dish?.name ?? "Unknown",
          quantity: item.quantity,
          price: dish?.price ?? 0,
        };
      });

      const orderTotal = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          session_id: orderSessionId,
          table_id: tableId || "walk-in",
          customer_phone: phone || null,
          items: orderItems,
          total: orderTotal,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        sessionStorage.removeItem("order_idempotency_key");
        localStorage.setItem("oasis_order_data", JSON.stringify(data));
        localStorage.setItem("oasis_order_session_id", orderSessionId);
        localStorage.setItem("oasis_order_placed", "true");
        localStorage.setItem("oasis_order_uuid", data.id);
        clearCart();
        setOrderData(data);
        setSubmitted(true);
      } else {
        setOrderError(data.error || `Request failed (${res.status})`);
      }
    } catch (err) {
      console.error("Order submission error:", err);
      setOrderError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <GlassCard className="max-w-md mx-6">
          <div className="text-5xl mb-4 text-green-400">✓</div>
          <h1 className="font-heading text-2xl text-gold mb-2">Order Placed!</h1>
          <p className="text-foreground/60 mb-4">Order #{orderData?.order_short_id}</p>

          <div className="border-t border-white/5 pt-4 mb-4 space-y-2">
            {orderData?.items.map((item) => (
              <div key={item.dish_id} className="flex justify-between text-sm">
                <span className="text-foreground/80">{item.quantity}x {item.name}</span>
                <span className="text-foreground/50">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-heading text-base pt-2 border-t border-white/5">
              <span className="text-foreground">Total</span>
              <span className="text-gold">{formatPrice(orderData?.total || 0)}</span>
            </div>
          </div>

          {orderData?.status === "pending" && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
              <p className="text-amber-400 text-sm font-medium">Pay at Counter</p>
              <p className="text-foreground/50 text-xs mt-1">Please proceed to the counter to complete your payment.</p>
            </div>
          )}
          {orderData?.status !== "pending" && orderData?.status !== "cancelled" && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
              <p className="text-green-400 text-sm font-medium">Payment Confirmed ✓</p>
              <p className="text-foreground/50 text-xs mt-1">Your order is being prepared by the kitchen.</p>
            </div>
          )}
          {orderData?.status === "cancelled" && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm font-medium">Order Cancelled</p>
              <p className="text-foreground/50 text-xs mt-1">
                {orderData?.cancellation?.reason ? `Reason: ${orderData.cancellation.reason}` : "This order has been cancelled."}
              </p>
            </div>
          )}

          {orderData?.status === "pending" && cancelCountdown !== null && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/orders/${orderData.id}/cancel`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ session_id: orderSessionId }),
                  });
                  const result = await res.json();
                  if (res.ok) {
                    localStorage.setItem("oasis_order_data", JSON.stringify({ 
                      ...orderData!, 
                      status: "cancelled", 
                      cancellation: result.cancellation 
                    }));
                    setOrderData({ ...orderData!, status: "cancelled", cancellation: result.cancellation });
                    toast.success("Order cancelled");
                  } else {
                    toast.error(result.error || "Failed to cancel order");
                  }
                } catch {
                  toast.error("Network error");
                }
              }}
              className="w-full mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
            >
              Cancel Order ({cancelCountdown}s)
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-foreground/40 mb-4">
            <span>
              Status:{" "}
              <span className={`font-semibold capitalize ${
                orderData?.status === "cancelled" 
                  ? "text-red-400" 
                  : orderData?.status === "completed" 
                    ? "text-green-400" 
                    : orderData?.status === "ready" 
                      ? "text-blue-400" 
                      : "text-gold"
              }`}>
                {orderData?.status || "pending"}
              </span>
            </span>
            <span>•</span>
            <span>#{orderData?.order_short_id}</span>
          </div>

          <div className="flex gap-3">
            <Link
              href="/order/track"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gold text-background font-heading text-sm hover:bg-gold/90 transition-colors"
            >
              Track Order →
            </Link>
            <Link
              href="/menu"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 text-foreground/60 font-heading text-sm hover:bg-white/10 transition-colors"
            >
              Back to Menu
            </Link>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                localStorage.removeItem("oasis_order_data");
                localStorage.removeItem("oasis_order_session_id");
                localStorage.removeItem("oasis_order_placed");
                localStorage.removeItem("oasis_order_uuid");
                setOrderData(null);
                setSubmitted(false);
              }}
              className="text-xs text-foreground/30 hover:text-gold transition-colors"
            >
              Place Another Order
            </button>
          </div>
        </GlassCard>
      </main>
    );
  }

  const hasItems = cartItems.length > 0;

  return (
    <main className="min-h-screen flex flex-col pt-28 sm:pt-32">
      <div className="max-w-3xl mx-auto w-full px-6 flex flex-col flex-1 pb-safe-nav">
        <h1 className="font-heading text-3xl md:text-5xl text-foreground mb-8 pt-4 flex-shrink-0">
          Your Order
        </h1>

        {!hasItems ? (
          <GlassCard className="text-center py-16">
            <p className="text-foreground/50 text-lg mb-2">Your cart is empty</p>
            <p className="text-foreground/30 text-sm">
              Browse our menu and add items to get started.
            </p>
          </GlassCard>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
              {cartItems.map((item) => (
                <GlassCard key={item.id} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sans font-medium text-foreground">{item.name}</h3>
                    <p className="text-gold text-sm mt-0.5">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-full p-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-gold/15 hover:text-gold text-foreground/70 flex items-center justify-center transition-all duration-250 active:scale-90"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-foreground text-sm font-heading font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-gold/15 hover:text-gold text-foreground/70 flex items-center justify-center transition-all duration-250 active:scale-90"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-foreground font-medium w-20 text-right">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-250 active:scale-90"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </GlassCard>
              ))}
            </div>

            <div className="flex-shrink-0 space-y-4 pt-4">
              <GlassCard>
                <label className="text-xs text-foreground/50 mb-1.5 block">
                  <Smartphone className="w-3 h-3 inline mr-1" />
                  WhatsApp Number (optional — get notified when ready)
                </label>
                 <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </GlassCard>

              <div className="sticky bottom-0 bg-[#050505] pt-4 pb-safe-nav z-10">
                <GlassCard className="flex items-center justify-between">
                  <span className="font-heading text-lg text-foreground">Total</span>
                  <span className="font-heading text-xl text-gold">{formatPrice(total)}</span>
                </GlassCard>

                  {orderError && (
                  <GlassCard className="!p-3 border-red-500/30">
                    <p className="text-red-400 text-sm">{orderError}</p>
                    <button onClick={() => setOrderError(null)} className="text-xs text-gold mt-1">
                      Try Again
                    </button>
                  </GlassCard>
                )}

                {kitchenWarning && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="text-amber-400 text-sm shrink-0">⚠️</span>
                    <p className="text-amber-300 text-xs">
                      Kitchen may not be actively monitoring — order will still be submitted
                    </p>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Place Order
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

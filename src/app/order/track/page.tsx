"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import GlassCard from "@/components/ui/GlassCard";
import { formatPrice } from "@/lib/utils";
import { Clock, CheckCircle, ChefHat, CookingPot, Check, ShoppingBag, XCircle } from "lucide-react";
import Link from "next/link";

const DEFAULT_STEPS = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "processing", label: "Processing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: CookingPot },
  { key: "completed", label: "Completed", icon: Check },
];

const CANCELLED_STEP = { key: "cancelled", label: "Cancelled", icon: XCircle };

function StatusStepper({ currentStatus }: { currentStatus: string }) {
  const steps = currentStatus === "cancelled" ? [...DEFAULT_STEPS, CANCELLED_STEP] : DEFAULT_STEPS;
  const currentIdx = steps.findIndex((s) => s.key === currentStatus);
  const activeIdx = currentIdx >= 0 ? currentIdx : 0;

  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto mb-8">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        let isActive = false;
        let isCurrent = idx === activeIdx;

        if (currentStatus === "cancelled") {
          isActive = step.key === "cancelled" || (step.key !== "completed" && idx <= activeIdx);
        } else {
          isActive = idx <= activeIdx;
        }

        return (
          <div key={step.key} className="flex flex-col items-center gap-2">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                isActive
                  ? step.key === "cancelled"
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gold text-background"
                  : "bg-white/5 text-foreground/30"
              } ${isCurrent ? (step.key === "cancelled" ? "ring-2 ring-red-500/50 ring-offset-2 ring-offset-[#050505]" : "ring-2 ring-gold/50 ring-offset-2 ring-offset-[#050505]") : ""}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] font-medium ${
                isActive
                  ? step.key === "cancelled"
                    ? "text-red-400 font-semibold"
                    : "text-gold"
                  : "text-foreground/30"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ElapsedTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
      if (mins < 1) setElapsed("Just now");
      else if (mins < 60) setElapsed(`${mins} min${mins !== 1 ? "s" : ""} ago`);
      else {
        const hrs = Math.floor(mins / 60);
        const rem = mins % 60;
        setElapsed(`${hrs}h ${rem}m ago`);
      }
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <div className="flex items-center gap-1.5 text-xs text-foreground/40">
      <Clock className="w-3 h-3" />
      {elapsed}
    </div>
  );
}

export default function TrackPage() {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [cancelCountdown, setCancelCountdown] = useState<number | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const sid = localStorage.getItem("oasis_order_session_id");
    setActiveSessionId(sid);
  }, []);

  const fetchOrder = useCallback(async () => {
    if (!activeSessionId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/orders?session_id=${activeSessionId}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setOrder(data[0]);
        setError(null);
      } else {
        setError("Order not found");
      }
    } catch {
      setError("Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [activeSessionId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (!order || order.status !== "pending") {
      setCancelCountdown(null);
      return;
    }
    const createdAt = new Date(order.created_at).getTime();
    const remaining = Math.max(0, 30 - Math.floor((Date.now() - createdAt) / 1000));
    if (remaining > 0) {
      setCancelCountdown(remaining);
    } else {
      setCancelCountdown(null);
    }
  }, [order]);

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
    if (!activeSessionId) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`order-track-${activeSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `session_id=eq.${activeSessionId}`,
        },
        (payload: any) => {
          setOrder(payload.new);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel?.unsubscribe();
    };
  }, [activeSessionId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/40 text-sm">Loading order...</p>
      </main>
    );
  }

  const lookupById = async () => {
    const trimmed = manualId.trim();
    if (!trimmed) return;
    setManualLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders?order_short_id=${trimmed}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem("oasis_order_session_id", data[0].session_id);
        setActiveSessionId(data[0].session_id);
        setOrder(data[0]);
        setError(null);
      } else {
        setError("Order not found");
      }
    } catch {
      setError("Failed to load order");
    } finally {
      setManualLoading(false);
    }
  };

  if (!activeSessionId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <GlassCard className="text-center max-w-md mx-6">
          <ShoppingBag className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
          <h1 className="font-heading text-xl text-foreground mb-2">No Active Order</h1>
          <p className="text-foreground/50 text-sm mb-6">
            You haven&apos;t placed an order yet, or your session has expired.
          </p>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter order number"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") lookupById(); }}
                className="flex-1 rounded-lg border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-gold/50 focus:outline-none"
              />
              <button
                onClick={lookupById}
                disabled={manualLoading}
                className="px-4 py-2.5 rounded-lg bg-gold text-background font-heading text-sm hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {manualLoading ? "..." : "Track"}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>
          <div className="mt-4">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 text-foreground/60 font-heading text-sm hover:bg-white/10 transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <GlassCard className="text-center max-w-md mx-6">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchOrder}
            className="px-4 py-2 rounded-lg bg-gold text-background font-heading text-sm hover:bg-gold/90 transition-colors"
          >
            Try Again
          </button>
        </GlassCard>
      </main>
    );
  }

  if (!order) return null;

  const status = order.status;
  const isProcessing = status !== "cancelled" && (status === "processing" || status === "ready" || status === "completed");
  const isReady = status === "ready" || status === "completed";
  const isCompleted = status === "completed";

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-heading text-2xl text-foreground">Order #{order.order_short_id}</h1>
          <ElapsedTimer createdAt={order.created_at} />
        </div>

        <StatusStepper currentStatus={status} />

        {/* Status messages */}
        <div className="text-center mb-8">
            {status === "pending" && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <p className="text-amber-400 font-medium">Awaiting Payment</p>
                <p className="text-foreground/50 text-sm mt-1">Please pay at the counter to start processing your order.</p>
                {cancelCountdown !== null && (
                  <button
                    onClick={async () => {
                      try {
                        const sessionId = localStorage.getItem("oasis_order_session_id");
                        if (!sessionId) return;
                        const res = await fetch(`/api/orders/${order.id}/cancel`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ session_id: sessionId }),
                        });
                        if (!res.ok) {
                          const err = await res.json();
                          alert(err.error || "Failed to cancel order");
                        }
                      } catch {
                        alert("Network error");
                      }
                    }}
                    className="mt-3 w-full px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                  >
                    Cancel Order ({cancelCountdown}s)
                  </button>
                )}
              </div>
            )}
          {isProcessing && !isReady && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-medium">Payment Confirmed</span>
              <span className="text-foreground/50 text-sm ml-2">— Your order is being prepared</span>
            </div>
          )}
          {isReady && !isCompleted && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-green-400 font-medium text-lg">Ready for Pickup! 🎉</p>
              <p className="text-foreground/50 text-sm mt-1">Your order is ready at the counter.</p>
            </div>
          )}
          {isCompleted && (
            <div className="bg-gold/10 border border-gold/20 rounded-lg p-4">
              <p className="text-gold font-medium text-lg">Enjoy! ✅</p>
              <p className="text-foreground/50 text-sm mt-1">We hope you loved your meal. Come back soon!</p>
            </div>
          )}
          {status === "cancelled" && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 font-medium">Order Cancelled</p>
              <p className="text-foreground/50 text-sm mt-1">
                {order.cancellation?.reason ? `Reason: ${order.cancellation.reason}` : "This order has been cancelled."}
              </p>
            </div>
          )}
        </div>

        {/* Order items */}
        <GlassCard className="space-y-3 !p-4">
          <div className="space-y-2">
            {order.items.map((item: any) => (
              <div key={item.dish_id} className="flex justify-between text-sm">
                <span className="text-foreground/80">{item.quantity}x {item.name}</span>
                <span className="text-foreground/50">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-heading text-base pt-3 border-t border-white/5">
            <span className="text-foreground">Total</span>
            <span className="text-gold">{formatPrice(order.total)}</span>
          </div>
        </GlassCard>

        <div className="text-center mt-8">
          <Link
            href="/menu"
            className="text-sm text-gold hover:text-gold/80 transition-colors"
          >
            ← Back to Menu
          </Link>
        </div>
      </div>
    </main>
  );
}

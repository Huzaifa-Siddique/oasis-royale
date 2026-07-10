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
  const [replyInput, setReplyInput] = useState("");
  const [negotiationLoading, setNegotiationLoading] = useState(false);
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

  const handleAcceptProposal = async () => {
    setNegotiationLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customization_status: "approved",
          session_id: activeSessionId,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to accept proposal");
      }
    } catch {
      alert("Network error");
    } finally {
      setNegotiationLoading(false);
    }
  };

  const handleReplyBack = async () => {
    if (!replyInput.trim()) return;
    setNegotiationLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customization_status: "pending_approval",
          customization_notes: replyInput,
          session_id: activeSessionId,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
        setReplyInput("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to send message");
      }
    } catch {
      alert("Network error");
    } finally {
      setNegotiationLoading(false);
    }
  };

  const handleCancelOrder = async (reason = "Customer cancelled order") => {
    setNegotiationLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: activeSessionId,
          reason,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to cancel order");
      }
    } catch {
      alert("Network error");
    } finally {
      setNegotiationLoading(false);
    }
  };

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

  // Recalculate Subtotal from items
  const subtotal = (order.items || []).reduce((sum: number, item: any) => {
    const customsPrice = (item.customizations || []).reduce((s: number, c: any) => s + c.price, 0);
    return sum + (item.price + customsPrice) * item.quantity;
  }, 0);

  return (
    <main className="min-h-screen pt-28 sm:pt-32">
      <div className="max-w-2xl mx-auto px-6 py-6 sm:py-12">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-heading text-2xl text-foreground">Order #{order.order_short_id}</h1>
          <ElapsedTimer createdAt={order.created_at} />
        </div>

        <StatusStepper currentStatus={status} />

        {/* Customization negotiation panel */}
        {status === "pending" && order.customization_status === "pending_approval" && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 mb-6 text-center space-y-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 text-sm animate-spin mb-1">
              ⌛
            </span>
            <h3 className="text-amber-400 font-heading text-sm font-semibold uppercase tracking-wider">Reviewing Custom Request</h3>
            <p className="text-foreground/70 text-xs leading-relaxed max-w-md mx-auto">
              Our counter staff is reviewing your special instructions. An estimated wait time is <strong className="text-gold">1 minute</strong>.
            </p>
            {order.special_instructions && (
              <div className="bg-black/30 border border-white/5 rounded-lg p-3 text-left font-mono text-xs text-foreground/80 max-w-md mx-auto">
                <span className="text-[10px] text-foreground/45 block mb-1 uppercase">Instructions:</span>
                "{order.special_instructions}"
              </div>
            )}
            {order.customization_notes && (
              <div className="bg-black/40 border border-amber-500/20 rounded-lg p-3 text-left text-xs text-amber-300/90 max-w-md mx-auto">
                <span className="text-[10px] text-amber-400 block mb-1 uppercase font-semibold">Latest Note:</span>
                "{order.customization_notes}"
              </div>
            )}
            
            <div className="pt-2 max-w-md mx-auto space-y-3">
              <textarea
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder="Type reply or update request details..."
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:border-gold/50 placeholder:text-foreground/30 resize-none h-14 font-mono"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReplyBack}
                  disabled={negotiationLoading || !replyInput.trim()}
                  className="flex-1 py-2 rounded-lg bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 text-xs font-semibold font-heading uppercase transition-all cursor-pointer"
                >
                  Send Reply
                </button>
                <button
                  onClick={() => handleCancelOrder("Customer cancelled during review")}
                  disabled={negotiationLoading}
                  className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 text-xs font-semibold font-heading uppercase transition-all cursor-pointer"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        )}

        {status === "pending" && order.customization_status === "proposed" && (
          <div className="bg-gold/10 border border-gold/30 rounded-xl p-5 mb-6 space-y-4">
            <div className="text-center">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gold/20 text-gold text-lg mb-1">
                💬
              </span>
              <h3 className="text-gold font-heading text-sm font-semibold uppercase tracking-wider">Proposal Received</h3>
              <p className="text-foreground/80 text-xs mt-1 leading-relaxed">
                The counter proposed a customization charge of <strong className="text-gold text-sm">{formatPrice(order.customization_charge)}</strong> for your request.
              </p>
            </div>

            {order.customization_notes && (
              <div className="bg-black/40 border border-gold/20 rounded-lg p-3.5 text-left text-xs text-foreground/85 font-sans leading-relaxed max-w-md mx-auto">
                <span className="text-[10px] text-gold block mb-1 uppercase font-heading tracking-wider">Staff Message:</span>
                "{order.customization_notes}"
              </div>
            )}

            <div className="max-w-md mx-auto space-y-3 pt-2">
              <div className="flex gap-2">
                <button
                  onClick={handleAcceptProposal}
                  disabled={negotiationLoading}
                  className="flex-1 py-2.5 rounded-lg bg-gold text-background hover:bg-gold/90 text-xs font-bold font-heading uppercase transition-all cursor-pointer"
                >
                  Proceed (+{formatPrice(order.customization_charge)})
                </button>
                <button
                  onClick={() => handleCancelOrder("Customer rejected proposed charges")}
                  disabled={negotiationLoading}
                  className="flex-1 py-2.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 text-xs font-semibold font-heading uppercase transition-all cursor-pointer"
                >
                  Cancel Order
                </button>
              </div>

              <div className="border-t border-white/5 pt-3 space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-foreground/45 block">Counter-Propose / Reply</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    placeholder="Ask for alternative or say okay..."
                    className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-gold/50"
                  />
                  <button
                    onClick={handleReplyBack}
                    disabled={negotiationLoading || !replyInput.trim()}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground/80 hover:bg-white/10 text-xs font-heading font-semibold cursor-pointer"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status messages */}
        <div className="text-center mb-8">
            {status === "pending" && order.customization_status !== "pending_approval" && order.customization_status !== "proposed" && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <p className="text-amber-400 font-medium">Awaiting Payment</p>
                <p className="text-foreground/50 text-sm mt-1">Please pay at the counter to start processing your order.</p>
                {cancelCountdown !== null && (
                  <button
                    onClick={() => handleCancelOrder("Customer cancelled order")}
                    className="mt-3 w-full px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors cursor-pointer"
                  >
                    Cancel Order ({cancelCountdown}s)
                  </button>
                )}
              </div>
            )}
          {isProcessing && !isReady && (
            <div className="space-y-3">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">Payment Confirmed</span>
                <span className="text-foreground/50 text-sm ml-2">— Your order is being prepared</span>
              </div>
              
              {order.estimated_minutes && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col items-center justify-center gap-1">
                  <span className="text-[10px] text-foreground/40 uppercase tracking-wider font-heading">Estimated Prep Time</span>
                  <span className="text-2xl font-heading text-gold">~{order.estimated_minutes} Minutes</span>
                  <span className="text-[10px] text-foreground/30 text-center"> Our kitchen chefs are on it! We will notify you when it's ready.</span>
                </div>
              )}
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
        <GlassCard className="space-y-4 !p-4">
          <div className="space-y-3">
            {order.items.map((item: any) => {
              const customsPrice = (item.customizations || []).reduce((s: number, c: any) => s + c.price, 0);
              return (
                <div key={item.dish_id} className="flex flex-col text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between">
                    <span className="text-foreground/80">{item.quantity}x {item.name}</span>
                    <span className="text-foreground/50">{formatPrice((item.price + customsPrice) * item.quantity)}</span>
                  </div>
                  {item.customizations && item.customizations.length > 0 && (
                    <span className="text-[10px] text-foreground/45 mt-0.5 ml-4 font-mono">
                      Add-ons: {item.customizations.map((c: any) => `${c.name} (+${formatPrice(c.price)})`).join(", ")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-1.5 pt-3 border-t border-white/5 text-xs text-foreground/50">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-foreground">{formatPrice(subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount</span>
                <span>-{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            {order.customization_charge > 0 && (
              <div className="flex justify-between text-gold">
                <span>Custom Request Charge</span>
                <span>+{formatPrice(order.customization_charge)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Taxes &amp; Fees</span>
              <span>Included</span>
            </div>
            <div className="flex justify-between font-heading text-base pt-2 border-t border-white/5 text-foreground">
              <span>Total Amount</span>
              <span className="text-gold font-bold">{formatPrice(order.total)}</span>
            </div>
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

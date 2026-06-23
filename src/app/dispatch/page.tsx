"use client";

import { useState, useEffect, useCallback } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { formatPrice, normalizePhone } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase";
import { authHeaders } from "@/lib/api-fetch";
import type { Order } from "@/lib/supabase-types";
import { Smartphone, Send, CheckCircle, Clock, Volume2, VolumeX, Eye, EyeOff, Phone, ShoppingBag, Package, Wifi } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useOrderSound } from "@/hooks/useOrderSound";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import RealtimeBanner from "@/components/ui/RealtimeBanner";

function buildWhatsAppUrl(order: Order): string {
  const phone = normalizePhone(order.customer_phone || "");
  if (!phone) return "";

  const items = order.items
    .map((i) => `\u2022 ${i.quantity}x ${i.name} \u2014 ${formatPrice(i.price * i.quantity)}`)
    .join("\n");

  const message = [
    `Your order #${order.order_short_id} from Oasis Royale is ready for pickup! \ud83c\udf89`,
    "",
    "Items:",
    items,
    "",
    `Total: ${formatPrice(order.total)}`,
    "",
    "Please collect from the counter. Thank you! \ud83d\ude4f",
    "",
    "\u2014 Oasis Royale Team",
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function getSentStatus(orderId: string): number | null {
  try {
    const val = localStorage.getItem(`dispatch_sent_${orderId}`);
    return val ? Number(val) : null;
  } catch {
    return null;
  }
}

function setSentStatus(orderId: string) {
  try {
    localStorage.setItem(`dispatch_sent_${orderId}`, Date.now().toString());
  } catch {}
}

function MaskedPhone({ phone }: { phone: string }) {
  const [revealed, setRevealed] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const toggle = () => {
    if (revealed) {
      setRevealed(false);
      if (timer) clearTimeout(timer);
      setTimer(null);
    } else {
      setRevealed(true);
      const t = setTimeout(() => {
        setRevealed(false);
        setTimer(null);
      }, 30000);
      setTimer(t);
    }
  };

  const normalized = normalizePhone(phone);
  const masked = normalized.length > 4 ? `****${normalized.slice(-4)}` : "****";

  return (
    <span className="inline-flex items-center gap-1.5">
      {revealed ? normalized : masked}
      <button onClick={toggle} className="p-0.5 hover:text-gold transition-colors" title={revealed ? "Hide" : "Reveal"}>
        {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </button>
    </span>
  );
}

function DispatchContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentMap, setSentMap] = useState<Record<string, number>>({});
  const [realtimeStatus, setRealtimeStatus] = useState<string | null>(null);
  const { playBeep, soundEnabled, toggleSound } = useOrderSound();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?status=ready", { headers: { ...authHeaders() } });
      const data: Order[] = await res.json();
      if (!Array.isArray(data)) return;
      setOrders(data);
      setError(null);
    } catch {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored: Record<string, number> = {};
    for (const order of orders) {
      const ts = getSentStatus(order.id);
      if (ts) stored[order.id] = ts;
    }
    setSentMap(stored);
  }, [orders]);

  useEffect(() => {
    fetchOrders();
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel("dispatch-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const order = payload.new as Order;
          if (order.status === "ready") {
            setOrders((prev) => {
              if (prev.some((o) => o.id === order.id)) return prev;
              playBeep(740, 0.35);
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
          setOrders((prev) => {
            if (!prev.some((o) => o.id === updated.id)) {
              return updated.status === "ready" ? [updated, ...prev] : prev;
            }
            if (updated.status === "ready") {
              return prev.map((o) => (o.id === updated.id ? updated : o));
            }
            return prev.filter((o) => o.id !== updated.id);
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "orders" },
        (payload) => {
          const deleted = payload.old as Order;
          setOrders((prev) => prev.filter((o) => o.id !== deleted.id));
        }
      )
      .subscribe((status) => setRealtimeStatus(status));

    const pollInterval = setInterval(fetchOrders, 30000);
    return () => {
      channel.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [fetchOrders, playBeep]);

  const handleSend = (order: Order) => {
    const url = buildWhatsAppUrl(order);
    if (!url) return;
    window.open(url, "_blank");
    setSentStatus(order.id);
    setSentMap((prev) => ({ ...prev, [order.id]: Date.now() }));
  };

  const handlePickup = async (order: Order) => {
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: "completed" }),
      });
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } catch {}
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-foreground/40 text-sm">Loading dispatch...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-8">
        <RealtimeBanner status={realtimeStatus} />
        <div className="flex items-center gap-3 mb-8">
          <Smartphone className="w-8 h-8 text-gold" />
          <h1 className="font-heading text-3xl text-foreground">Dispatch</h1>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              title={soundEnabled ? "Mute" : "Unmute"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-gold" /> : <VolumeX className="w-4 h-4 text-foreground/30" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={fetchOrders} className="text-xs text-gold mt-1">Retry</button>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-24">
            <ShoppingBag className="w-16 h-16 text-foreground/10 mx-auto mb-4" />
            <h2 className="font-heading text-xl text-foreground/50 mb-2">No Dispatching Yet</h2>
            <p className="text-foreground/30 text-sm">Ready orders will appear here for dispatch and pickup.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map((order) => {
              const sentTs = sentMap[order.id] || getSentStatus(order.id);
              const waUrl = buildWhatsAppUrl(order);
              return (
                <GlassCard key={order.id} className="space-y-3 !p-4 !pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-lg text-gold">#{order.order_short_id}</span>
                    <span className="text-xs text-foreground/40">Table {order.table_id}</span>
                  </div>
                  {order.customer_name && (
                    <p className="text-xs text-foreground/60">{order.customer_name}</p>
                  )}
                  {order.customer_phone && (
                    <p className="text-xs text-foreground/50 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <MaskedPhone phone={order.customer_phone} />
                    </p>
                  )}
                  <div className="space-y-1">
                    {order.items.map((item: any) => (
                      <div key={item.dish_id} className="flex justify-between text-xs">
                        <span className="text-foreground/80">{item.quantity}x {item.name}</span>
                        <span className="text-foreground/60">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-white/5">
                    <div>
                      <span className="text-[10px] text-foreground/40 uppercase tracking-wider block sm:inline mr-1">Total:</span>
                      <span className="font-heading text-base text-gold">{formatPrice(order.total)}</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {order.customer_phone && (sentTs ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-green-400 mr-2">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Sent {new Date(sentTs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      ) : (
                        <Button variant="secondary" size="md" onClick={() => handleSend(order)} disabled={!waUrl} className="cursor-pointer">
                          <Send className="w-3.5 h-3.5" />
                          Send
                        </Button>
                      ))}
                      <Button variant="primary" size="md" onClick={() => handlePickup(order)} className="cursor-pointer">
                        <Package className="w-3.5 h-3.5" />
                        Picked Up
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function DispatchPage() {
  return (
    <ProtectedRoute allowedRoles={["staff", "admin"]}>
      <DispatchContent />
    </ProtectedRoute>
  );
}

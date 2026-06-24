"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import GlassCard from "@/components/ui/GlassCard";
import { formatPrice } from "@/lib/utils";
import { getSupabaseClient } from "@/lib/supabase";
import type { Order as KitchenOrder, OrderStatus } from "@/lib/supabase-types";
import { authHeaders } from "@/lib/api-fetch";
import {
  Clock, ChefHat, Smartphone, Monitor, Star, Tag, LogOut, Volume2, VolumeX, Wifi, Sliders, Play,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { useOrderSound } from "@/hooks/useOrderSound";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import RealtimeBanner from "@/components/ui/RealtimeBanner";

const sortByOldest = (a: KitchenOrder, b: KitchenOrder) =>
  new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

function getElapsedMinutes(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}

function UrgencyBadge({ createdAt }: { createdAt: string }) {
  const mins = getElapsedMinutes(createdAt);
  if (mins < 1) return null;
  const urgent = mins > 20;
  const warn = mins > 10 && !urgent;
  return (
    <span className={`text-[10px] font-medium ${
      urgent ? "text-red-400" : warn ? "text-amber-400" : "text-foreground/30"
    }`}>
      {mins}m ago
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
      source === "counter"
        ? "bg-teal/20 text-teal-200 border border-teal/30"
        : "bg-gold/20 text-gold border border-gold/30"
    }`}>
      {source === "counter" ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
      {source === "counter" ? "Counter" : "QR"}
    </span>
  );
}

const ACTIVE_STATUSES: OrderStatus[] = ["processing"];

function isActive(status: string): status is OrderStatus {
  return (ACTIVE_STATUSES as readonly string[]).includes(status);
}

export default function KitchenPage() {
  const { signOut, profile, accessToken } = useAuth();
  const getHeaders = useCallback((): Record<string, string> => {
    const h: Record<string, string> = {};
    if (accessToken) h.Authorization = `Bearer ${accessToken}`;
    return h;
  }, [accessToken]);
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [tick, setTick] = useState(0);
  const [realtimeStatus, setRealtimeStatus] = useState<string | null>(null);
  const [heartbeatActive, setHeartbeatActive] = useState(false);
  const { playBeep, soundEnabled, toggleSound, volume, setVolume, toneType, setToneType } = useOrderSound();
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeActionOrder, setActiveActionOrder] = useState<KitchenOrder | null>(null);
  const [actionType, setActionType] = useState<"eta" | "cancel" | null>(null);
  const [selectedEta, setSelectedEta] = useState<number>(15);
  const [cancelReason, setCancelReason] = useState<string>("customer_cancelled");
  const [customCancelReason, setCustomCancelReason] = useState<string>("");

  const handleConfirmEta = async () => {
    if (!activeActionOrder) return;
    const orderId = activeActionOrder.id;
    setActiveActionOrder(null);
    setActionType(null);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({
          estimated_minutes: selectedEta,
          estimated_minutes_set_by: "kitchen",
        }),
      });
      fetchOrders();
    } catch {}
    fetchOrders();
  };

  const handleConfirmCancel = async () => {
    if (!activeActionOrder) return;
    const orderId = activeActionOrder.id;
    const reason = cancelReason === "other" ? customCancelReason : cancelReason;
    if (!reason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setActiveActionOrder(null);
    setActionType(null);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({ 
          status: "cancelled",
          cancellation: {
            reason,
            cancelled_by: "kitchen",
            cancelled_at: new Date().toISOString(),
          }
        }),
      });
      fetchOrders();
    } catch {
      fetchOrders();
    }
    fetchOrders();
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?status=processing", { headers: { ...getHeaders() } });
      const data: KitchenOrder[] = await res.json();
      if (!Array.isArray(data)) return;
      setOrders((prev) => {
        const newIds = new Set(data.map((o) => o.id));
        const prevIds = prevOrderIdsRef.current;
        const hasNewOrders = [...newIds].some((id) => !prevIds.has(id));
        if (hasNewOrders) playBeep(880, 0.4);
        prevOrderIdsRef.current = newIds;
        return data;
      });
    } catch {}
  }, [playBeep, getHeaders]);

  useEffect(() => {
    const sendHeartbeat = () => {
      fetch("/api/kitchen/heartbeat", { method: "POST", headers: { ...getHeaders() } }).catch(() => {});
    };
    sendHeartbeat();
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 15000);
    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [getHeaders]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !profile) return;

    const channel = supabase.channel("kitchen_status", {
      config: {
        presence: {
          key: profile.id,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setHeartbeatActive(Object.keys(state).length > 0);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            online_at: new Date().toISOString(),
            email: profile.email,
            name: profile.name,
            role: profile.role,
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [profile]);

  useEffect(() => {
    fetchOrders();
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel("orders-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const order = payload.new as KitchenOrder;
          if (isActive(order.status)) {
            setOrders((prev) => {
              if (prev.some((o) => o.id === order.id)) return prev;
              playBeep(880, 0.4);
              return [order, ...prev];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updated = payload.new as KitchenOrder;
          setOrders((prev) => {
            if (!prev.some((o) => o.id === updated.id)) {
              return isActive(updated.status) ? [updated, ...prev] : prev;
            }
            if (isActive(updated.status)) {
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
          const deleted = payload.old as KitchenOrder;
          setOrders((prev) => prev.filter((o) => o.id !== deleted.id));
        }
      )
      .subscribe((status) => setRealtimeStatus(status));

    const pollInterval = setInterval(fetchOrders, 30000);
    const tickInterval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => {
      channel.unsubscribe();
      clearInterval(pollInterval);
      clearInterval(tickInterval);
    };
  }, [fetchOrders, playBeep]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, status: newStatus as KitchenOrder["status"] } : o
        )
      );
    }
  };

  const processing = orders.filter((o) => o.status === "processing").sort(sortByOldest);

  function ActionCard({ order, nextStatus, nextLabel, variant }: {
    order: KitchenOrder;
    nextStatus: string;
    nextLabel: string;
    variant: "secondary" | "primary";
  }) {
    const mins = getElapsedMinutes(order.created_at);
    const borderUrgency = mins > 20 ? "border-red-500/40" : mins > 10 ? "border-amber-500/40" : "";
    return (
      <GlassCard className={`space-y-3 border-2 ${borderUrgency} transition-colors duration-500`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-heading text-lg text-gold">#{order.order_short_id}</span>
            {order.priority === "vip" && <Star className="w-4 h-4 text-gold fill-gold" />}
          </div>
          <div className="flex items-center gap-2">
            <SourceBadge source={order.source} />
            <span className="text-xs text-foreground/40">Table {order.table_id}</span>
          </div>
        </div>
        {order.customer_name && (
          <p className="text-xs text-foreground/50">Customer: {order.customer_name}</p>
        )}
        {order.customer_phone && (
          <p className="text-xs text-foreground/50">Phone: {order.customer_phone}</p>
        )}
        {order.tags && order.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {order.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-foreground/50 border border-white/5">
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="space-y-1.5">
          {order.items.map((item) => (
            <div key={item.dish_id} className="flex justify-between text-sm">
              <span className="text-foreground/80">{item.quantity}x {item.name}</span>
              <span className="text-foreground/50">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-2.5 text-xs text-foreground/40 flex-wrap">
            <Clock className="w-3.5 h-3.5" />
            <UrgencyBadge createdAt={order.created_at} />
            <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <button
              type="button"
              onClick={() => {
                setActiveActionOrder(order);
                setActionType("eta");
                setSelectedEta(order.estimated_minutes || 15);
              }}
              className="text-gold/75 hover:text-gold transition-colors font-medium border border-gold/20 rounded px-2 py-0.5 bg-gold/5 cursor-pointer"
            >
              ~{order.estimated_minutes || 15}m
            </button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                setActiveActionOrder(order);
                setActionType("cancel");
                setCancelReason("customer_cancelled");
                setCustomCancelReason("");
              }}
              className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-heading hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Button
              variant={variant}
              size="md"
              onClick={() => updateStatus(order.id, nextStatus)}
              className="cursor-pointer"
            >
              {nextLabel}
            </Button>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["staff", "admin"]}>
      <main className="min-h-screen bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 pt-28 pb-8">
          <RealtimeBanner status={realtimeStatus} />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex items-center gap-3">
              {realtimeStatus === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED && (
                <Wifi className="w-4 h-4 text-green-400/60" />
              )}
              <ChefHat className="w-8 h-8 text-gold" />
              <h1 className="font-heading text-2xl sm:text-3xl text-foreground">Kitchen Dashboard</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:justify-end sm:ml-auto">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                heartbeatActive ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${heartbeatActive ? "bg-green-400" : "bg-amber-400"}`} />
                {heartbeatActive ? "Staff Online" : "No Staff Online"}
              </span>
              {profile && <span className="text-[10px] sm:text-xs text-foreground/40">{profile.email.replace(/(.{3})(.*)(@.*)/, "$1***$3")}</span>}
              <div className="relative">
                <button
                  onClick={() => setShowSoundSettings(!showSoundSettings)}
                  className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-gold transition-colors cursor-pointer"
                  title="Notification Sound Settings"
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <Sliders className="w-3 h-3 opacity-60" />
                </button>
                {showSoundSettings && (
                  <GlassCard className="absolute right-0 top-8 z-50 w-64 !p-4 border border-white/10 shadow-2xl bg-[#090909]/95 backdrop-blur-md text-left">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                      <span className="text-xs font-heading text-gold uppercase tracking-wider">Audio Settings</span>
                      <button 
                        onClick={() => setShowSoundSettings(false)}
                        className="text-xs text-foreground/40 hover:text-foreground"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Toggle Sound */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground/70">Sound Notifications</span>
                        <button
                          onClick={toggleSound}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${soundEnabled ? 'bg-gold' : 'bg-white/10'}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-background transition-transform ${soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Tone Type */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-foreground/40 uppercase tracking-wider font-heading">Tone Type</label>
                        <div className="grid grid-cols-3 gap-1">
                          {(["beep", "chime", "pulse"] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => setToneType(t)}
                              className={`py-1 text-xs rounded border transition-all cursor-pointer ${
                                toneType === t
                                  ? "bg-gold/20 text-gold border-gold/40"
                                  : "bg-white/5 text-foreground/50 border-white/5 hover:bg-white/10"
                              }`}
                            >
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Volume Slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-foreground/40 uppercase tracking-wider font-heading">
                          <span>Volume</span>
                          <span>{Math.round(volume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round(volume * 100)}
                          onChange={(e) => setVolume(parseFloat(e.target.value) / 100)}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                        />
                      </div>

                      {/* Test Tone */}
                      <button
                        onClick={() => playBeep(880, 0.4)}
                        disabled={!soundEnabled}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-white/5 border border-white/10 text-xs text-foreground/80 hover:bg-white/10 disabled:opacity-40 transition-all font-medium cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        Test Notification Sound
                      </button>
                    </div>
                  </GlassCard>
                )}
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-gold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <h2 className="text-sm font-heading tracking-wider uppercase mb-4"
                style={{ color: processing.length > 0 ? "#60a5fa" : "rgba(247,247,247,0.5)" }}>
                Processing ({processing.length})
              </h2>
              <div className="space-y-4">
                {processing.map((order) => (
                  <ActionCard key={order.id} order={order} nextStatus="ready" nextLabel="Mark Ready" variant="primary" />
                ))}
                {processing.length === 0 && <p className="text-foreground/30 text-sm">No active orders</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Modals for Update ETA & Order Cancellation */}
        {activeActionOrder && actionType === "eta" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#111111]">
                <h3 className="font-heading text-lg text-gold">Update Prep Time (ETA)</h3>
                <button onClick={() => { setActiveActionOrder(null); setActionType(null); }} className="text-foreground/40 hover:text-foreground">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-foreground/80">
                  Update estimated preparation time for order <strong className="text-gold">#{activeActionOrder.order_short_id}</strong>.
                  <span className="block text-xs text-amber-400/80 mt-1">⚠️ Note: Kitchen can only increase preparation time.</span>
                </p>
                
                <div className="space-y-2">
                  <label className="text-xs text-foreground/40 block">Add Extra Prep Time:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[5, 10, 15, 20, 30].map((increment) => {
                      const targetVal = (activeActionOrder.estimated_minutes || 15) + increment;
                      return (
                        <button
                          key={increment}
                          type="button"
                          onClick={() => setSelectedEta(targetVal)}
                          className={`py-2 px-3 rounded-lg border text-xs font-heading transition-colors ${
                            selectedEta === targetVal
                              ? "border-gold bg-gold/10 text-gold"
                              : "border-white/10 hover:border-white/20 text-foreground/75"
                          }`}
                        >
                          +{increment} min ({targetVal}m)
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs text-foreground/50">New Total Prep Time:</span>
                  <input
                    type="number"
                    min={(activeActionOrder.estimated_minutes || 15) + 1}
                    max={180}
                    value={selectedEta}
                    onChange={(e) => setSelectedEta(Math.max((activeActionOrder.estimated_minutes || 15) + 1, Number(e.target.value)))}
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
                    onClick={handleConfirmEta}
                    disabled={selectedEta <= (activeActionOrder.estimated_minutes || 15)}
                  >
                    Save Changes
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
      </main>
    </ProtectedRoute>
  );
}

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Section, SectionHeader } from "@/components/ui/Section";
import GlassCard from "@/components/ui/GlassCard";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/supabase-types";
import { authHeaders } from "@/lib/api-fetch";
import { useAuth } from "@/lib/auth-context";
import {
  TrendingUp,
  Users,
  Clock,
  Smartphone,
  Monitor,
  Search,
  Download,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { HeatmapGrid, WastageSummary } from "@/components/ui";

type SourceFilter = "all" | "qr" | "counter";

function getTodayRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return { from, to };
}

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

function AdminDashboardContent() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const todayRange = getTodayRange();
  const [dateFrom, setDateFrom] = useState(toDateInputValue(todayRange.from));
  const [dateTo, setDateTo] = useState(toDateInputValue(todayRange.to));
  const [activeTab, setActiveTab] = useState<"overview" | "qr-codes">("overview");
  const [tables, setTables] = useState<{ id: string; name: string }[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  useEffect(() => {
    if (activeTab !== "qr-codes" || tables.length > 0) return;
    const fetchTables = async () => {
      setLoadingTables(true);
      try {
        const res = await fetch("/api/tables");
        const data = await res.json();
        if (Array.isArray(data)) setTables(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTables(false);
      }
    };
    fetchTables();
  }, [activeTab, tables.length]);

  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
      const res = await fetch(`/api/orders?${params}`, { headers: { ...authHeaders() } });
      const data: Order[] = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (sourceFilter !== "all" && o.source !== sourceFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          String(o.order_short_id).includes(q) ||
          o.table_id.toLowerCase().includes(q) ||
          (o.customer_name || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, sourceFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const total = orders.length;
    const qr = orders.filter((o) => o.source === "qr").length;
    const counter = orders.filter((o) => o.source === "counter").length;
    const revenue = orders.reduce(
      (sum, o) => sum + (o.status !== "cancelled" ? o.total : 0),
      0
    );
    const pending = orders.filter((o) => o.status === "pending").length;
    const completed = orders.filter((o) => o.status === "completed");
    const cancelled = orders.filter((o) => o.status === "cancelled").length;

    let avgProcessingTime = 0;
    if (completed.length > 0) {
      const totalMs = completed.reduce((sum, o) => {
        const created = new Date(o.created_at).getTime();
        const updated = new Date(o.updated_at).getTime();
        return sum + (updated - created);
      }, 0);
      avgProcessingTime = Math.round(totalMs / completed.length / 60000);
    }

    const cancellationRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : "0.0";

    return { total, qr, counter, revenue, pending, avgProcessingTime, cancellationRate, cancelled };
  }, [orders]);

  const handleCancelOrder = async () => {
    if (!cancellingOrderId || !cancelReason.trim()) return;
    try {
      const res = await fetch(`/api/orders/${cancellingOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          status: "cancelled",
          cancellation: {
            reason: cancelReason.trim(),
            cancelled_by: profile?.name || "admin",
            cancelled_at: new Date().toISOString(),
          },
        }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === cancellingOrderId
              ? { ...o, status: "cancelled", cancellation: { reason: cancelReason.trim(), cancelled_by: profile?.name || "admin", cancelled_at: new Date().toISOString() } }
              : o
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCancellingOrderId(null);
      setCancelReason("");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20",
    processing:
      "text-blue-400 bg-blue-400/10 border border-blue-400/20",
    ready: "text-green-400 bg-green-400/10 border border-green-400/20",
    completed: "text-foreground/40 bg-white/5 border border-white/10",
    cancelled: "text-red-400 bg-red-400/10 border border-red-400/20",
  };

  if (loading) {
    return (
      <div className="pt-32 text-center">
        <p className="text-foreground/40">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <SectionHeader
            tag="Administration"
            title="Orders Dashboard"
            subtitle="Real-time overview of all orders — QR and counter."
          />
          <a
            href={`/api/orders/export?date_from=${dateFrom}&date_to=${dateTo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 transition-all text-sm font-medium w-fit sm:w-auto"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>
        </div>

        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "overview"
                ? "bg-gold text-background font-semibold"
                : "text-foreground/60 hover:text-gold hover:bg-white/5"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("qr-codes")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "qr-codes"
                ? "bg-gold text-background font-semibold"
                : "text-foreground/60 hover:text-gold hover:bg-white/5"
            }`}
          >
            Tables & QR Codes
          </button>
        </div>

        {activeTab === "overview" ? (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <GlassCard className="!p-4 sm:!p-5">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="w-5 h-5 text-gold" />
                </div>
                <p className="text-xl sm:text-2xl font-heading mb-1">{stats.total}</p>
                <p className="text-[10px] sm:text-xs text-foreground/50">Total Orders</p>
              </GlassCard>
              <GlassCard className="!p-4 sm:!p-5">
                <div className="flex items-center justify-between mb-3">
                  <Smartphone className="w-5 h-5 text-gold" />
                </div>
                <p className="text-xl sm:text-2xl font-heading mb-1">{stats.qr}</p>
                <p className="text-[10px] sm:text-xs text-foreground/50">QR Orders</p>
              </GlassCard>
              <GlassCard className="!p-4 sm:!p-5">
                <div className="flex items-center justify-between mb-3">
                  <Monitor className="w-5 h-5 text-teal-200" />
                </div>
                <p className="text-xl sm:text-2xl font-heading mb-1">{stats.counter}</p>
                <p className="text-[10px] sm:text-xs text-foreground/50">Counter Orders</p>
              </GlassCard>
              <GlassCard className="!p-4 sm:!p-5">
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-5 h-5 text-gold" />
                </div>
                <p className="text-xl sm:text-2xl font-heading mb-1 truncate">
                  {formatPrice(stats.revenue)}
                </p>
                <p className="text-[10px] sm:text-xs text-foreground/50">Total Revenue</p>
              </GlassCard>
              <GlassCard className="!p-4 sm:!p-5">
                <div className="flex items-center justify-between mb-3">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-xl sm:text-2xl font-heading mb-1">{stats.pending}</p>
                <p className="text-[10px] sm:text-xs text-foreground/50">Awaiting Kitchen</p>
              </GlassCard>
              <GlassCard className="!p-4 sm:!p-5">
                <div className="flex items-center justify-between mb-3">
                  <Clock className="w-5 h-5 text-teal-200" />
                </div>
                <p className="text-xl sm:text-2xl font-heading mb-1">{stats.avgProcessingTime}m</p>
                <p className="text-[10px] sm:text-xs text-foreground/50">Avg. Process Time</p>
              </GlassCard>
              <GlassCard className="!p-4 sm:!p-5">
                <div className="flex items-center justify-between mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-xl sm:text-2xl font-heading mb-1">{stats.cancellationRate}%</p>
                <p className="text-[10px] sm:text-xs text-foreground/50">Cancel Rate</p>
              </GlassCard>
            </div>

        {/* Date Range & Filters */}
        <div className="flex flex-col gap-4 p-4 rounded-xl bg-white/5 border border-white/10 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-foreground/40 uppercase tracking-wider font-heading">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-foreground focus:border-gold/30 focus:outline-none"
              />
              <span className="text-[10px] text-foreground/40 uppercase tracking-wider font-heading">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-foreground focus:border-gold/30 focus:outline-none"
              />
              <button
                onClick={() => {
                  const r = getTodayRange();
                  setDateFrom(toDateInputValue(r.from));
                  setDateTo(toDateInputValue(r.to));
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 transition-all cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-foreground/40 uppercase tracking-wider font-heading mr-1">
                Source:
              </span>
              {(["all", "qr", "counter"] as SourceFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSourceFilter(s)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                    sourceFilter === s
                      ? "bg-gold/20 text-gold border border-gold/30"
                      : "bg-white/5 text-foreground/50 border border-white/5 hover:bg-white/10"
                  }`}
                >
                  {s === "all" ? "All" : s === "qr" ? "QR" : "Counter"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-foreground/40 uppercase tracking-wider font-heading mr-1">
                Status:
              </span>
              {["all", "pending", "processing", "ready", "completed", "cancelled"].map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                      statusFilter === s
                        ? "bg-gold/20 text-gold border border-gold/30"
                        : "bg-white/5 text-foreground/50 border border-white/5 hover:bg-white/10"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="relative w-full lg:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30" />
            <input
              type="text"
              placeholder="Search order #, table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-foreground placeholder:text-foreground/30 focus:border-gold/30 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Orders Table - Desktop View */}
        <div className="hidden md:block">
          <GlassCard className="overflow-hidden !p-0">
            <div className="p-5 border-b border-white/5">
              <h3 className="font-heading text-sm tracking-wider uppercase text-gold">
                Order History
              </h3>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-foreground/40 font-medium uppercase tracking-wider text-xs">#</th>
                    <th className="text-left p-4 text-foreground/40 font-medium uppercase tracking-wider text-xs">Source</th>
                    <th className="text-left p-4 text-foreground/40 font-medium uppercase tracking-wider text-xs">Customer</th>
                    <th className="text-left p-4 text-foreground/40 font-medium uppercase tracking-wider text-xs">Table</th>
                    <th className="text-left p-4 text-foreground/40 font-medium uppercase tracking-wider text-xs">Items</th>
                    <th className="text-right p-4 text-foreground/40 font-medium uppercase tracking-wider text-xs">Total</th>
                    <th className="text-left p-4 text-foreground/40 font-medium uppercase tracking-wider text-xs">Status</th>
                    <th className="text-right p-4 text-foreground/40 font-medium uppercase tracking-wider text-xs">Time</th>
                    <th className="text-center p-4 text-foreground/40 font-medium uppercase tracking-wider text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-foreground/30">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4 font-heading text-gold">#{order.order_short_id}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            order.source === "counter"
                              ? "bg-teal/20 text-teal-200"
                              : "bg-gold/20 text-gold"
                          }`}>
                            {order.source === "counter" ? "Counter" : "QR"}
                          </span>
                        </td>
                        <td className="p-4 text-foreground/80">
                          {order.customer_name || <span className="text-foreground/30">—</span>}
                        </td>
                        <td className="p-4 text-foreground/60">{order.table_id}</td>
                        <td className="p-4 text-foreground/60">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </td>
                        <td className="p-4 text-right font-heading text-gold">{formatPrice(order.total)}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-medium ${
                            statusColors[order.status] || "text-foreground/40 bg-white/5"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-right text-foreground/40 text-xs">
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-4 text-center">
                          {order.status !== "cancelled" && order.status !== "completed" ? (
                            cancellingOrderId === order.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Reason..."
                                  value={cancelReason}
                                  onChange={(e) => setCancelReason(e.target.value)}
                                  className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-foreground w-24 focus:border-red-400/30 focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  onClick={handleCancelOrder}
                                  disabled={!cancelReason.trim()}
                                  className="px-2 py-1 rounded text-[10px] font-medium bg-red-400/20 text-red-400 border border-red-400/30 hover:bg-red-400/30 disabled:opacity-40 transition-all"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => { setCancellingOrderId(null); setCancelReason(""); }}
                                  className="px-2 py-1 rounded text-[10px] font-medium bg-white/5 text-foreground/50 border border-white/10 hover:bg-white/10 transition-all"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setCancellingOrderId(order.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-all"
                              >
                                <XCircle className="w-3 h-3" />
                                Cancel
                              </button>
                            )
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Orders Cards - Mobile View */}
        <div className="block md:hidden space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-heading text-sm tracking-wider uppercase text-gold">
              Order History
            </h3>
            <span className="text-[10px] text-foreground/40 font-mono">{filtered.length} orders</span>
          </div>
          {filtered.length === 0 ? (
            <GlassCard className="text-center p-8 text-foreground/30">
              No orders found
            </GlassCard>
          ) : (
            filtered.map((order) => (
              <GlassCard key={order.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-gold">#{order.order_short_id}</span>
                  <span className="text-xs text-foreground/40">
                    {new Date(order.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-foreground/40 block text-[9px] uppercase tracking-wider">Source</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium mt-1 ${
                      order.source === "counter" ? "bg-teal/20 text-teal-200" : "bg-gold/20 text-gold"
                    }`}>
                      {order.source === "counter" ? "Counter" : "QR"}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground/40 block text-[9px] uppercase tracking-wider">Customer</span>
                    <span className="text-foreground/80 mt-1 block truncate font-medium">
                      {order.customer_name || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground/40 block text-[9px] uppercase tracking-wider">Table</span>
                    <span className="text-foreground/80 mt-1 block font-medium">{order.table_id}</span>
                  </div>
                  <div>
                    <span className="text-foreground/40 block text-[9px] uppercase tracking-wider">Items</span>
                    <span className="text-foreground/60 mt-1 block font-medium">{order.items.length} items</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div>
                    <span className="text-foreground/40 text-[9px] uppercase tracking-wider block">Total</span>
                    <span className="font-heading text-gold text-sm">{formatPrice(order.total)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-medium ${
                      statusColors[order.status] || "text-foreground/40 bg-white/5"
                    }`}>
                      {order.status}
                    </span>
                    
                    {order.status !== "cancelled" && order.status !== "completed" && (
                      cancellingOrderId === order.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Reason..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-foreground w-20 focus:border-red-400/30 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={handleCancelOrder}
                            disabled={!cancelReason.trim()}
                            className="px-1.5 py-1 rounded text-[9px] font-medium bg-red-400/20 text-red-400 border border-red-400/30"
                          >
                            Go
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCancellingOrderId(order.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-all cursor-pointer"
                        >
                          <XCircle className="w-2.5 h-2.5" />
                          Cancel
                        </button>
                      )
                    )}
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {/* Source Breakdown */}
        {orders.length > 0 && (
          <GlassCard className="!p-5">
            <h3 className="font-heading text-sm tracking-wider uppercase text-gold mb-4">
              Order Source Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground/70">QR Orders</span>
                  <span className="text-sm font-heading text-gold">{stats.qr}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${stats.total > 0 ? (stats.qr / stats.total) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground/70">Counter Orders</span>
                  <span className="text-sm font-heading text-teal-200">{stats.counter}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${stats.total > 0 ? (stats.counter / stats.total) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Charts & Analytics */}
        {orders.length > 0 && (
          <GlassCard className="!p-5">
            <h3 className="font-heading text-sm tracking-wider uppercase text-gold mb-6">
              Charts &amp; Analytics
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Orders by Hour */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-foreground/50 font-heading mb-3">Orders by Hour</h4>
                <div className="space-y-1.5">
                  {(() => {
                    const hourly: Record<number, number> = {};
                    for (let i = 0; i < 24; i++) hourly[i] = 0;
                    orders.forEach((o) => {
                      const h = new Date(o.created_at).getHours();
                      hourly[h] = (hourly[h] || 0) + 1;
                    });
                    const max = Math.max(...Object.values(hourly), 1);
                    return Object.entries(hourly).map(([hour, count]) => (
                      <div key={hour} className="flex items-center gap-2">
                        <span className="text-[10px] text-foreground/40 w-6 text-right">{hour}h</span>
                        <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(count / max) * 100}%`, background: "linear-gradient(90deg, #d4a853, #f0d68a)" }}
                          />
                        </div>
                        <span className="text-[10px] text-foreground/60 w-5 text-right">{count}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Cancellation Rate */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-foreground/50 font-heading mb-3">Cancellation Rate</h4>
                <div className="flex flex-col justify-center h-full">
                  <div className="h-4 bg-white/5 rounded-full overflow-hidden mb-3">
                    <div className="flex h-full rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0}%` }}
                      />
                      <div
                        className="bg-green-500 transition-all"
                        style={{ width: `${stats.total > 0 ? ((stats.total - stats.cancelled) / stats.total) * 100 : 100}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-foreground/60">
                    {stats.cancelled} cancelled out of {stats.total} orders ({stats.cancellationRate}%)
                  </p>
                </div>
              </div>

              {/* Revenue Trend by Day */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-foreground/50 font-heading mb-3">Revenue Trend by Day</h4>
                <div className="flex items-end gap-1.5 h-32">
                  {(() => {
                    const byDate: Record<string, number> = {};
                    const dates: string[] = [];
                    orders.forEach((o) => {
                      if (o.status === "cancelled") return;
                      const d = new Date(o.created_at).toISOString().slice(0, 10);
                      if (!byDate[d]) { byDate[d] = 0; dates.push(d); }
                      byDate[d] += o.total;
                    });
                    const maxRev = Math.max(...Object.values(byDate), 1);
                    return dates.map((d) => {
                      const rev = byDate[d];
                      const pct = (rev / maxRev) * 100;
                      return (
                        <div key={d} className="flex-1 flex flex-col items-center justify-end h-full">
                          <span className="text-[9px] text-foreground/40 mb-1">{formatPrice(rev)}</span>
                          <div
                            className="w-full rounded-t transition-all"
                            style={{ height: `${pct}%`, background: "linear-gradient(180deg, #f0d68a, #d4a853)" }}
                          />
                          <span className="text-[9px] text-foreground/30 mt-1">{d.slice(5)}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Dynamic Floor Plan Heatmap Widget */}
        <HeatmapGrid dateFrom={dateFrom} dateTo={dateTo} />

        {/* Dynamic Food Wastage and Revenue Leakage Analysis Widget */}
        <WastageSummary dateFrom={dateFrom} dateTo={dateTo} />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-heading text-foreground">Table QR Codes</h2>
              <p className="text-sm text-foreground/50 mt-1">
                Scan a QR code to bind your session to a table on your test phone, or open the direct test links.
              </p>
            </div>

            {loadingTables ? (
              <div className="py-20 text-center text-foreground/40">Loading tables...</div>
            ) : tables.length === 0 ? (
              <div className="py-20 text-center text-foreground/40">No active tables found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {tables.map((table) => {
                  const testUrl = typeof window !== "undefined" ? `${window.location.origin}/?table_id=${table.id}` : "";
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(testUrl)}`;

                  return (
                    <GlassCard key={table.id} className="flex flex-col items-center p-6 text-center space-y-4">
                      <div className="w-full flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="font-heading text-sm text-gold">{table.name}</span>
                        <span className="text-[10px] text-foreground/40 font-mono">ID: {table.id}</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrUrl}
                          alt={`QR Code for ${table.name}`}
                          className="w-40 h-40 object-contain"
                          loading="lazy"
                        />
                      </div>

                      <div className="w-full pt-2 flex flex-col gap-2">
                        <a
                          href={testUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 text-xs font-semibold tracking-wide transition-all"
                        >
                          Open Test Link
                        </a>
                        <a
                          href={qrUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-1.5 rounded-xl bg-white/5 text-foreground/60 border border-white/5 hover:bg-white/10 text-[10px] font-medium transition-all"
                        >
                          View Large QR
                        </a>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

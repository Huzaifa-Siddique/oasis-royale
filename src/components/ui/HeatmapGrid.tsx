"use client";

import { useState, useEffect, useMemo } from "react";
import { formatPrice } from "@/lib/utils";
import { authHeaders } from "@/lib/api-fetch";
import GlassCard from "./GlassCard";
import { Flame, Landmark } from "lucide-react";

type TableMetric = {
  tableId: string;
  orderCount: number;
  revenue: number;
  cancelledCount: number;
  intensity: number;
};

type TableInfo = {
  id: string;
  name: string;
};

type Props = {
  dateFrom: string;
  dateTo: string;
};

export default function HeatmapGrid({ dateFrom, dateTo }: Props) {
  const [metricType, setMetricType] = useState<"revenue" | "orders">("revenue");
  const [heatmapData, setHeatmapData] = useState<TableMetric[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all tables and heatmap metrics
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch all active tables
        const tablesRes = await fetch("/api/tables", { headers: { ...authHeaders() } });
        const tablesData = await tablesRes.json();
        
        // Fetch heatmap metrics for current date range
        const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
        const heatmapRes = await fetch(`/api/admin/reports/heatmap?${params}`, {
          headers: { ...authHeaders() },
        });
        const report = await heatmapRes.json();

        if (Array.isArray(tablesData)) setTables(tablesData);
        if (report && Array.isArray(report.tables)) setHeatmapData(report.tables);
      } catch (err) {
        console.error("Failed to load heatmap data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [dateFrom, dateTo]);

  // Merge tables with heatmap data
  const mergedTables = useMemo(() => {
    const metricMap = new Map(heatmapData.map((m) => [m.tableId, m]));
    const list = tables.map((t) => {
      const metric = metricMap.get(t.id) || {
        tableId: t.id,
        orderCount: 0,
        revenue: 0,
        cancelledCount: 0,
        intensity: 0,
      };
      return {
        id: t.id,
        name: t.name,
        ...metric,
      };
    });

    // Also include "walk-in" if there are walk-in orders
    const walkInMetric = metricMap.get("walk-in");
    if (walkInMetric && (walkInMetric.orderCount > 0 || walkInMetric.revenue > 0)) {
      list.push({
        id: "walk-in",
        name: "Walk-in (No Table)",
        ...walkInMetric,
      });
    }

    return list;
  }, [tables, heatmapData]);

  // Find max metrics for relative glow scaling
  const maxValues = useMemo(() => {
    const revs = mergedTables.map((t) => t.revenue);
    const ords = mergedTables.map((t) => t.orderCount);
    return {
      revenue: Math.max(...revs, 1),
      orders: Math.max(...ords, 1),
    };
  }, [mergedTables]);

  if (loading) {
    return (
      <div className="py-8 text-center text-foreground/40 text-xs">
        Loading floor plan heatmap...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-wider text-foreground/50 font-heading flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-gold" />
          Floor Heatmap
        </h4>
        <div className="flex bg-white/5 border border-white/5 rounded-lg overflow-hidden p-0.5">
          <button
            onClick={() => setMetricType("revenue")}
            className={`px-2.5 py-1 text-[10px] font-medium rounded transition-all ${
              metricType === "revenue" ? "bg-gold text-background" : "text-foreground/50 hover:text-foreground"
            }`}
          >
            By Revenue
          </button>
          <button
            onClick={() => setMetricType("orders")}
            className={`px-2.5 py-1 text-[10px] font-medium rounded transition-all ${
              metricType === "orders" ? "bg-gold text-background" : "text-foreground/50 hover:text-foreground"
            }`}
          >
            By Orders
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
        {mergedTables.map((t) => {
          // Calculate local scale percentage
          const pct = metricType === "revenue" ? t.revenue / maxValues.revenue : t.orderCount / maxValues.orders;
          
          // Style config for glow intensity
          const style = {
            boxShadow: pct > 0 ? `0 0 ${Math.round(pct * 20)}px rgba(212, 168, 83, ${pct * 0.15})` : undefined,
            borderColor: pct > 0 ? `rgba(212, 168, 83, ${0.1 + pct * 0.3})` : undefined,
          };

          return (
            <GlassCard
              key={t.id}
              style={style}
              className={`flex flex-col justify-between text-center select-none min-h-[100px] transition-all duration-300 relative group overflow-hidden ${
                pct > 0 ? "hover:scale-[1.03]" : ""
              }`}
            >
              {/* Subtle light pulse background for highly active tables */}
              {pct > 0.6 && (
                <div className="absolute inset-0 bg-gold/5 animate-pulse pointer-events-none" />
              )}

              <div className="relative z-10 space-y-1">
                <Landmark className={`w-4 h-4 mx-auto ${pct > 0 ? "text-gold" : "text-foreground/20"}`} />
                <p className="font-heading text-xs truncate" style={{ color: pct > 0 ? "#fff" : "rgba(255,255,255,0.4)" }}>
                  {t.name}
                </p>
              </div>

              <div className="relative z-10 mt-3 pt-2 border-t border-white/5 space-y-0.5">
                <p className="font-heading text-[11px] text-gold">
                  {formatPrice(t.revenue)}
                </p>
                <p className="text-[9px] text-foreground/40">
                  {t.orderCount} order{t.orderCount !== 1 ? "s" : ""}
                </p>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { formatPrice } from "@/lib/utils";
import { authHeaders } from "@/lib/api-fetch";
import GlassCard from "./GlassCard";
import { Trash2, AlertTriangle } from "lucide-react";

type DishWastage = {
  name: string;
  quantity: number;
  revenue: number;
};

type WastageReport = {
  total: {
    quantity: number;
    revenue: number;
  };
  byCategory: Record<string, { quantity: number; revenue: number; dishes: Record<string, DishWastage> }>;
  byDish: Record<string, DishWastage>;
  cancelledCount: number;
};

type Props = {
  dateFrom: string;
  dateTo: string;
};

export default function WastageSummary({ dateFrom, dateTo }: Props) {
  const [report, setReport] = useState<WastageReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
        const res = await fetch(`/api/admin/reports/wastage?${params}`, {
          headers: { ...authHeaders() },
        });
        const data = await res.json();
        setReport(data);
      } catch (err) {
        console.error("Failed to load wastage data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [dateFrom, dateTo]);

  // Sort dishes by revenue wasted
  const topWastedDishes = useMemo(() => {
    if (!report || !report.byDish) return [];
    return Object.entries(report.byDish)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [report]);

  const maxWastedRevenue = useMemo(() => {
    const revs = topWastedDishes.map((d) => d.revenue);
    return Math.max(...revs, 1);
  }, [topWastedDishes]);

  if (loading) {
    return (
      <div className="py-8 text-center text-foreground/40 text-xs">
        Loading wastage reports...
      </div>
    );
  }

  if (!report || (report as any).error || !report.total || report.cancelledCount === 0) {
    return (
      <GlassCard className="text-center py-8">
        <p className="text-foreground/40 text-xs">
          {(report as any).error || "No order wastage recorded for this period"}
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Overview Stat Card */}
      <GlassCard className="flex flex-col justify-between">
        <div>
          <h4 className="text-xs uppercase tracking-wider text-foreground/50 font-heading flex items-center gap-1.5 mb-4">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            Wastage Overview
          </h4>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-foreground/40 uppercase font-heading">Total Revenue Lost</p>
              <p className="text-3xl font-heading text-red-400 mt-1">
                {formatPrice(report.total.revenue)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[10px] text-foreground/40 uppercase font-heading">Cancelled Orders</p>
                <p className="text-xl font-heading text-foreground/80 mt-0.5">
                  {report.cancelledCount}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-foreground/40 uppercase font-heading">Items Wasted</p>
                <p className="text-xl font-heading text-foreground/80 mt-0.5">
                  {report.total.quantity}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-foreground/40">
          Wastage report captures all raw ingredients and preparation costs lost due to order cancellations during processing.
        </div>
      </GlassCard>

      {/* Top Wasted Dishes */}
      <GlassCard>
        <h4 className="text-xs uppercase tracking-wider text-foreground/50 font-heading flex items-center gap-1.5 mb-4">
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          Top Wasted Dishes
        </h4>
        <div className="space-y-3.5">
          {topWastedDishes.map((dish) => {
            const pct = (dish.revenue / maxWastedRevenue) * 100;
            return (
              <div key={dish.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground/80 font-medium">{dish.name}</span>
                  <span className="text-red-400 font-heading">
                    {formatPrice(dish.revenue)} <span className="text-foreground/30 font-sans text-[10px] font-normal">({dish.quantity} wasted)</span>
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}




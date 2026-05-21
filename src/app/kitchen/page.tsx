"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import GlassCard from "@/components/ui/GlassCard";
import { formatPrice } from "@/lib/utils";
import { Clock, ChefHat } from "lucide-react";

type OrderItem = {
  dish_id: string;
  name: string;
  quantity: number;
  price: number;
};

type KitchenOrder = {
  id: string;
  order_short_id: number;
  table_id: string;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
};

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("kitchen_orders");
    if (stored) {
      setOrders(JSON.parse(stored));
    }
  }, []);

  const updateStatus = (id: string, status: string) => {
    const updated = orders.map((o) =>
      o.id === id ? { ...o, status } : o
    );
    setOrders(updated);
    localStorage.setItem("kitchen_orders", JSON.stringify(updated));
  };

  const pending = orders.filter((o) => o.status === "pending");
  const processing = orders.filter((o) => o.status === "processing");
  const ready = orders.filter((o) => o.status === "ready");

  const OrderCard = ({ order }: { order: KitchenOrder }) => (
    <GlassCard className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-heading text-lg text-gold">
          #{order.order_short_id}
        </span>
        <span className="text-xs text-foreground/40">
          Table {order.table_id}
        </span>
      </div>
      <div className="space-y-1.5">
        {order.items.map((item) => (
          <div key={item.dish_id} className="flex justify-between text-sm">
            <span className="text-foreground/80">
              {item.quantity}x {item.name}
            </span>
            <span className="text-foreground/50">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-xs text-foreground/40 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(order.created_at).toLocaleTimeString()}
        </span>
        <span className="font-medium text-sm">{formatPrice(order.total)}</span>
      </div>
    </GlassCard>
  );

  const ActionsCard = ({
    order,
    nextStatus,
    nextLabel,
  }: {
    order: KitchenOrder;
    nextStatus: string;
    nextLabel: string;
  }) => (
    <GlassCard className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-heading text-lg text-gold">
          #{order.order_short_id}
        </span>
        <span className="text-xs text-foreground/40">
          Table {order.table_id}
        </span>
      </div>
      <div className="space-y-1.5">
        {order.items.map((item) => (
          <div key={item.dish_id} className="flex justify-between text-sm">
            <span className="text-foreground/80">
              {item.quantity}x {item.name}
            </span>
            <span className="text-foreground/50">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-xs text-foreground/40 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(order.created_at).toLocaleTimeString()}
        </span>
        <Button
          variant={nextStatus === "processing" ? "secondary" : "primary"}
          size="sm"
          onClick={() => updateStatus(order.id, nextStatus)}
        >
          {nextLabel}
        </Button>
      </div>
    </GlassCard>
  );

  return (
    <main className="min-h-screen bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <ChefHat className="w-8 h-8 text-gold" />
          <h1 className="font-heading text-3xl text-foreground">
            Kitchen Dashboard
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h2 className="text-sm font-heading tracking-wider text-foreground/50 uppercase mb-4">
              Pending ({pending.length})
            </h2>
            <div className="space-y-4">
              {pending.map((order) => (
                <ActionsCard
                  key={order.id}
                  order={order}
                  nextStatus="processing"
                  nextLabel="Accept"
                />
              ))}
              {pending.length === 0 && (
                <p className="text-foreground/30 text-sm">No pending orders</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-heading tracking-wider text-foreground/50 uppercase mb-4">
              Processing ({processing.length})
            </h2>
            <div className="space-y-4">
              {processing.map((order) => (
                <ActionsCard
                  key={order.id}
                  order={order}
                  nextStatus="ready"
                  nextLabel="Mark Ready"
                />
              ))}
              {processing.length === 0 && (
                <p className="text-foreground/30 text-sm">No active orders</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-heading tracking-wider text-foreground/50 uppercase mb-4">
              Ready ({ready.length})
            </h2>
            <div className="space-y-4">
              {ready.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {ready.length === 0 && (
                <p className="text-foreground/30 text-sm">No ready orders</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

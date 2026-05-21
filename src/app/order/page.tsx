"use client";

import { useState, useEffect } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Trash2, Minus, Plus } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export default function OrderPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableId, setTableId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("oasis_cart");
    if (stored) setCart(JSON.parse(stored));

    const tid = localStorage.getItem("oasis_table_id");
    if (tid) setTableId(tid);

    const handler = () => {
      const stored = localStorage.getItem("oasis_cart");
      if (stored) setCart(JSON.parse(stored));
    };
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    const updated = cart
      .map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
      .filter((item) => item.quantity > 0);
    setCart(updated);
    localStorage.setItem("oasis_cart", JSON.stringify(updated));
  };

  const removeItem = (id: string) => {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    localStorage.setItem("oasis_cart", JSON.stringify(updated));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_id: tableId || "walk-in",
          items: cart.map((item) => ({
            dish_id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        localStorage.removeItem("oasis_cart");
      }
    } catch {
      // silently fail - order will be shown on screen regardless
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <GlassCard className="text-center max-w-md mx-6">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="font-heading text-2xl text-gold mb-2">Order Placed!</h1>
          <p className="text-foreground/60">
            Your order has been sent to the kitchen. We&apos;ll bring it to your table shortly.
          </p>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="font-heading text-3xl md:text-5xl text-foreground mb-8">
            Your Order
          </h1>

          {cart.length === 0 ? (
            <GlassCard className="text-center py-16">
              <p className="text-foreground/50 text-lg mb-2">Your cart is empty</p>
              <p className="text-foreground/30 text-sm">
                Browse our menu and add items to get started.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <GlassCard key={item.id} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-foreground truncate">
                      {item.name}
                    </h3>
                    <p className="text-gold text-sm mt-0.5">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-foreground/60" />
                    </button>
                    <span className="w-8 text-center text-foreground text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-foreground/60" />
                    </button>
                  </div>
                  <p className="text-foreground font-medium w-20 text-right">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400/70" />
                  </button>
                </GlassCard>
              ))}

              <GlassCard className="flex items-center justify-between">
                <span className="font-heading text-lg text-foreground">Total</span>
                <span className="font-heading text-xl text-gold">
                  {formatPrice(total)}
                </span>
              </GlassCard>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleSubmit}
              >
                Place Order
              </Button>
            </div>
          )}
        </div>
    </main>
  );
}

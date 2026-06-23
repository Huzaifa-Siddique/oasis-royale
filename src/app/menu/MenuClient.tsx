"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import MenuCard from "@/components/ui/MenuCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Dish } from "@/lib/supabase-types";
import { useCart } from "@/lib/cart-context";
import { authHeaders } from "@/lib/api-fetch";
import { toast } from "sonner";
import { arSingleton } from "@/lib/ar-singleton";
import { formatPrice, cn } from "@/lib/utils";
import { ShoppingCart, Minus, Plus, Trash2, X, Smartphone, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";

export default function MenuClient() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const { items, addItem, updateQuantity, removeItem, clearCart, getCount } = useCart();
  const categoryRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Drawer States
  const [cartOpen, setCartOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [kitchenWarning, setKitchenWarning] = useState(false);
  const [tableId, setTableId] = useState("");

  const fetchDishes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dishes", { headers: { ...authHeaders() } });
      if (!res.ok) throw new Error("Failed to fetch dishes");
      const data = await res.json();
      setDishes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  // Load table ID from localStorage/cookie
  useEffect(() => {
    let tid = localStorage.getItem("oasis_table_id");
    if (!tid) {
      const cookieMatch = document.cookie.match(/(?:^|;\s*)oasis_table_id=([^;]*)/);
      if (cookieMatch) {
        tid = cookieMatch[1];
        localStorage.setItem("oasis_table_id", tid);
      }
    }
    if (tid) setTableId(tid);
  }, []);

  // Check kitchen status
  useEffect(() => {
    fetch("/api/kitchen/heartbeat")
      .then((r) => r.json())
      .then((data) => setKitchenWarning(!data.active))
      .catch(() => {});
  }, []);

  const groupedDishes = useMemo(() => {
    return dishes.reduce<Record<string, Dish[]>>((acc, dish) => {
      const category = dish.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(dish);
      return acc;
    }, {});
  }, [dishes]);

  const categories = useMemo(() => Object.keys(groupedDishes), [groupedDishes]);

  const categoryBarRef = useRef<HTMLDivElement>(null);

  const scrollToCategory = useCallback((category: string) => {
    arSingleton.detach();
    const el = categoryRefs.current.get(category);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cat = entry.target.getAttribute("data-category");
            if (cat) setActiveCategory(cat);
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 }
    );

    categoryRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories]);

  const setCategoryRef = useCallback((category: string, el: HTMLElement | null) => {
    if (el) {
      categoryRefs.current.set(category, el);
    } else {
      categoryRefs.current.delete(category);
    }
  }, []);

  const handleOrder = useCallback(
    (dish: Dish) => {
      addItem(dish.id);
      toast.success(`Added ${dish.name} to order`);
    },
    [addItem]
  );

  const handleRetry = useCallback(() => {
    setRetryCount((c) => c + 1);
    fetchDishes();
  }, [fetchDishes]);

  // Drawer Cart Items
  const dishMap = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes]);
  const cartItems = useMemo(() => {
    return items
      .map((item) => {
        const dish = dishMap.get(item.id);
        if (!dish) return null;
        return { id: item.id, name: dish.name, price: dish.price, quantity: item.quantity };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [items, dishMap]);

  const cartCount = useMemo(() => getCount(), [getCount]);
  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const handleCheckout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setOrderError(null);

    const idempotencyKey = crypto.randomUUID();
    const orderSessionId = localStorage.getItem("oasis_order_session_id") || crypto.randomUUID();
    localStorage.setItem("oasis_order_session_id", orderSessionId);

    try {
      const orderItems = items.map((item) => {
        const dish = dishMap.get(item.id);
        return {
          dish_id: item.id,
          name: dish?.name ?? "Unknown",
          quantity: item.quantity,
          price: dish?.price ?? 0,
        };
      });

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
          total: total,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("oasis_order_data", JSON.stringify(data));
        localStorage.setItem("oasis_order_placed", "true");
        localStorage.setItem("oasis_order_uuid", data.id);
        clearCart();
        setOrderData(data);
        setOrderSubmitted(true);
        toast.success("Order placed successfully!");
      } else {
        setOrderError(data.error || `Request failed (${res.status})`);
      }
    } catch (err) {
      console.error("Order submission error:", err);
      setOrderError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen pb-32">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <span className="text-gold text-sm font-heading tracking-[0.2em] uppercase">
            Discover
          </span>
          <h1 className="font-heading text-4xl md:text-6xl text-foreground mt-3">
            Our Menu
          </h1>
          <p className="text-foreground/60 mt-4 max-w-xl mx-auto">
            Explore our carefully curated selection of dishes, each crafted
            to elevate your dining experience.
          </p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <MenuCard key={i} loading />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center text-red-400 py-12">
            <p className="text-xl">Something went wrong</p>
            <p className="text-foreground/50 mt-2">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-4 px-6 py-2 rounded-xl bg-gold/20 text-gold text-sm font-medium hover:bg-gold/30 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && categories.length > 0 && (
          <>
            <div
              ref={categoryBarRef}
              className="sticky top-0 z-30 -mx-6 px-6 py-3 mb-8 backdrop-blur-xl bg-[#050505]/80 border-b border-white/5 overflow-x-auto scrollbar-hide"
            >
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => scrollToCategory(cat)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                      activeCategory === cat
                        ? "bg-gold/20 text-gold border border-gold/30"
                        : "bg-white/5 text-foreground/50 border border-white/5 hover:bg-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              {categories.map((category) => (
                <div
                  key={category}
                  ref={(el) => setCategoryRef(category, el)}
                  data-category={category}
                  className="mb-12 scroll-mt-24"
                >
                  <h2 className="font-heading text-2xl text-foreground mb-6 border-l-2 border-gold/45 pl-3">
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedDishes[category].map((dish) => (
                      <MenuCard
                        key={dish.id}
                        dish={dish}
                        onOrder={handleOrder}
                        onRetry={undefined}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && !error && categories.length === 0 && (
          <div className="text-center text-foreground/50 py-12">
            <p className="text-xl">No dishes available</p>
          </div>
        )}
      </div>

      {/* Floating Cart Launcher Button */}
      {cartCount > 0 && (
        <Link
          href="/order"
          className="fixed bottom-24 right-6 z-40 bg-gold text-background pl-4 pr-5 py-3.5 rounded-full shadow-[0_0_25px_rgba(212,175,55,0.35)] border border-gold/40 flex items-center gap-2.5 font-heading text-xs tracking-wider uppercase active:scale-95 transition-all duration-300 hover:bg-gold/95 hover:scale-105 hover:shadow-[0_0_35px_rgba(212,175,55,0.55)] group"
        >
          <div className="relative mr-1">
            <ShoppingCart className="w-4.5 h-4.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[-6deg]" />
            <span className="absolute -top-2 -right-2.5 bg-background text-gold text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-gold/30">
              {cartCount}
            </span>
          </div>
          <span>View Order</span>
        </Link>
      )}

      {/* Slide-out Cart Drawer Backdrop */}
      {cartOpen && (
        <div
          onClick={() => setCartOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        />
      )}

      {/* Slide-out Cart Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full sm:w-[480px] bg-[#070707] border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-out p-6 pb-safe-nav",
          cartOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5 text-gold" />
            <h2 className="font-heading text-lg text-foreground">Your Order</h2>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 text-foreground/50 hover:text-foreground rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {orderSubmitted ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 text-3xl mb-4">
              ✓
            </div>
            <h3 className="font-heading text-xl text-gold mb-2">Order Placed!</h3>
            <p className="text-foreground/60 text-sm mb-4">Order #{orderData?.order_short_id}</p>
            <p className="text-foreground/40 text-xs mb-8">
              Please proceed to the counter to complete your payment.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Link
                href="/order/track"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gold text-background font-heading text-xs tracking-wider uppercase hover:bg-gold/90 transition-colors"
                onClick={() => setCartOpen(false)}
              >
                Track Order
              </Link>
              <button
                onClick={() => {
                  setOrderSubmitted(false);
                  setOrderData(null);
                  setCartOpen(false);
                }}
                className="w-full py-3 rounded-xl bg-white/5 text-foreground/75 font-heading text-xs tracking-wider uppercase hover:bg-white/10 transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-4 text-foreground/50">
            <ShoppingCart className="w-12 h-12 stroke-[1.5px] mb-4 text-foreground/20" />
            <p className="font-heading text-sm text-foreground/45 mb-1">Your cart is empty</p>
            <p className="text-xs text-foreground/30">Browse the menu and add dishes to your order.</p>
          </div>
        ) : (
          <>
            {/* Scrollable Items list */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-white/5 bg-[#0b0b0b]/60 flex items-center gap-4 transition-all hover:border-white/10"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-sans font-medium text-sm text-foreground truncate">{item.name}</h4>
                    <p className="text-gold text-xs mt-0.5">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-full p-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-gold/15 hover:text-gold text-foreground/70 flex items-center justify-center transition-all duration-250 active:scale-90"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-foreground text-xs font-heading font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-gold/15 hover:text-gold text-foreground/70 flex items-center justify-center transition-all duration-250 active:scale-90"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-250 active:scale-90"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Inputs & Checkout details */}
            <div className="space-y-4 border-t border-white/5 pt-4">
              <div className="p-4 rounded-xl border border-white/5 bg-[#0b0b0b]/60">
                <label className="text-[10px] font-heading tracking-widest text-foreground/50 mb-2 block uppercase">
                  <Smartphone className="w-3 h-3 inline mr-1 text-gold" />
                  WhatsApp Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-gold/50 transition-colors"
                />
                <p className="text-[10px] text-foreground/45 mt-1.5 leading-relaxed">
                  We'll send you an automated WhatsApp message when your food is ready.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/5 bg-[#0b0b0b]/80 flex items-center justify-between">
                <span className="font-heading text-sm text-foreground">Total</span>
                <span className="font-heading text-base text-gold">{formatPrice(total)}</span>
              </div>

              {orderError && (
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 flex flex-col gap-1.5">
                  <p className="text-red-400 text-xs">{orderError}</p>
                  <button onClick={() => setOrderError(null)} className="text-[10px] text-gold hover:underline self-start">
                    Dismiss
                  </button>
                </div>
              )}

              {kitchenWarning && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-300 text-[10px] leading-relaxed">
                    Kitchen status is offline. You can still place your order and show it to the counter staff.
                  </p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full min-h-[48px] rounded-xl bg-gold text-background font-heading text-xs tracking-wider uppercase font-bold flex items-center justify-center gap-2 hover:bg-gold/95 hover:shadow-lg hover:shadow-gold/15 active:scale-[0.97] transition-all duration-300 disabled:opacity-50"
              >
                {isSubmitting && <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />}
                Place Order
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

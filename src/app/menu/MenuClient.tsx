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
import { ShoppingCart, Minus, Plus, Trash2, X, Smartphone, AlertCircle, Sparkles, Heart } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Modal } from "@/components/ui";

export default function MenuClient() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const { items, addItem, updateQuantity, removeItem, clearCart, getCount } = useCart();
  const categoryRefs = useRef<Map<string, HTMLElement>>(new Map());
  const { user } = useAuth();

  // Favorites States
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Drawer States
  const [cartOpen, setCartOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [kitchenWarning, setKitchenWarning] = useState(false);
  const [tableId, setTableId] = useState("");

  // Customization & Calculation States
  const [customizingDish, setCustomizingDish] = useState<Dish | null>(null);
  const [selectedCustoms, setSelectedCustoms] = useState<Array<{ name: string; price: number }>>([]);
  const [taxRate, setTaxRate] = useState(8.25);
  const [serviceCharge, setServiceCharge] = useState(10.00);
  const [discountCodes, setDiscountCodes] = useState<any[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [discountError, setDiscountError] = useState("");

  useEffect(() => {
    fetch("/api/restaurant-status")
      .then((r) => r.json())
      .then((data) => {
        if (data.tax_rate !== undefined) setTaxRate(Number(data.tax_rate));
        if (data.service_charge !== undefined) setServiceCharge(Number(data.service_charge));
        if (data.discount_codes !== undefined) setDiscountCodes(data.discount_codes || []);
      })
      .catch(() => {});
  }, []);

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

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }
    try {
      const res = await fetch("/api/favorites", { headers: { ...authHeaders() } });
      if (res.ok) {
        const data = await res.json();
        setFavorites((data || []).map((fav: any) => fav.dish_id));
      }
    } catch (e) {
      console.error("Error fetching favorites:", e);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleToggleFavorite = useCallback(async (dishId: string) => {
    if (!user) {
      toast.error("Please sign in to favorite dishes");
      return;
    }
    
    const isFav = favorites.includes(dishId);
    try {
      if (isFav) {
        setFavorites((prev) => prev.filter((id) => id !== dishId));
        const res = await fetch(`/api/favorites?dish_id=${dishId}`, {
          method: "DELETE",
          headers: { ...authHeaders() },
        });
        if (!res.ok) {
          setFavorites((prev) => [...prev, dishId]);
          toast.error("Failed to remove from favorites");
        } else {
          toast.success("Removed from favorites");
        }
      } else {
        setFavorites((prev) => [...prev, dishId]);
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({ dish_id: dishId }),
        });
        if (!res.ok) {
          setFavorites((prev) => prev.filter((id) => id !== dishId));
          toast.error("Failed to add to favorites");
        } else {
          toast.success("Added to favorites!");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to update favorites");
    }
  }, [user, favorites]);

  // Load table ID from localStorage/cookie (prioritize cookie updated by QR scan redirect)
  useEffect(() => {
    const cookieMatch = document.cookie.match(/(?:^|;\s*)oasis_table_id=([^;]*)/);
    let tid = cookieMatch ? cookieMatch[1] : null;

    if (tid) {
      localStorage.setItem("oasis_table_id", tid);
    } else {
      tid = localStorage.getItem("oasis_table_id");
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
    const filtered = showFavoritesOnly
      ? dishes.filter((d) => favorites.includes(d.id))
      : dishes;

    return filtered.reduce<Record<string, Dish[]>>((acc, dish) => {
      const category = dish.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(dish);
      return acc;
    }, {});
  }, [dishes, favorites, showFavoritesOnly]);

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
      const addons = (dish.metadata as any)?.customizations || [];
      if (addons.length > 0) {
        setCustomizingDish(dish);
        setSelectedCustoms([]);
      } else {
        addItem(dish.id);
        toast.success(`Added ${dish.name} to order`);
      }
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
        return {
          id: item.id,
          name: dish.name,
          price: dish.price,
          quantity: item.quantity,
          customizations: item.customizations || [],
          uniqueKey: item.uniqueKey
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [items, dishMap]);

  const cartCount = useMemo(() => getCount(), [getCount]);
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const customsPrice = (item.customizations || []).reduce((s: number, c: any) => s + c.price, 0);
      return sum + (item.price + customsPrice) * item.quantity;
    }, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.type === "percent") {
      return subtotal * (appliedDiscount.value / 100);
    } else {
      return appliedDiscount.value;
    }
  }, [subtotal, appliedDiscount]);

  const afterDiscount = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);
  const taxAmount = useMemo(() => afterDiscount * (taxRate / 100), [afterDiscount, taxRate]);
  const serviceChargeAmount = useMemo(() => afterDiscount * (serviceCharge / 100), [afterDiscount, serviceCharge]);
  const grandTotal = useMemo(() => afterDiscount + taxAmount + serviceChargeAmount, [afterDiscount, taxAmount, serviceChargeAmount]);

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
        const dbCustomizations = (dish?.metadata as any)?.customizations || [];
        const validatedCustoms = (item.customizations || []).map((c: any) => {
          const dbCustom = dbCustomizations.find((dc: any) => dc.name === c.name);
          return {
            name: c.name,
            price: dbCustom?.price !== undefined ? Number(dbCustom.price) : 0,
          };
        });

        return {
          dish_id: item.id,
          name: dish?.name ?? "Unknown",
          quantity: item.quantity,
          price: dish?.price ?? 0,
          customizations: validatedCustoms,
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
          total: grandTotal,
          special_instructions: specialInstructions || null,
          customization_status: specialInstructions ? "pending_approval" : "none",
          discount_code: appliedDiscount?.code || null,
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
    <main className="min-h-screen pb-32 pt-28 sm:pt-32">
      <div className="max-w-7xl mx-auto px-6 py-6 sm:py-12">
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
              <div className="flex gap-2 items-center">
                {user && (
                  <button
                    onClick={() => {
                      arSingleton.detach();
                      setShowFavoritesOnly(!showFavoritesOnly);
                    }}
                    className={cn(
                      "shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                      showFavoritesOnly
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-white/5 text-foreground/50 border border-white/5 hover:bg-white/10"
                    )}
                  >
                    <Heart className={cn("w-3.5 h-3.5", showFavoritesOnly ? "fill-red-400 text-red-400" : "text-foreground/50")} />
                    Favorites ({favorites.length})
                  </button>
                )}
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => scrollToCategory(cat)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
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
                        isFavorite={favorites.includes(dish.id)}
                        onToggleFavorite={handleToggleFavorite}
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
            <p className="text-xl">
              {showFavoritesOnly ? "No favorite dishes yet" : "No dishes available"}
            </p>
            {showFavoritesOnly && (
              <p className="text-xs text-foreground/35 mt-2">
                Tap the heart icon on any dish to add it to your favorites list.
              </p>
            )}
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
                  key={item.uniqueKey}
                  className="p-4 rounded-xl border border-white/5 bg-[#0b0b0b]/60 flex flex-col gap-2 transition-all hover:border-white/10"
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-sans font-medium text-sm text-foreground">{item.name}</h4>
                      <p className="text-gold text-xs mt-0.5">{formatPrice(item.price)}</p>
                      {item.customizations && item.customizations.length > 0 && (
                        <div className="text-[10px] text-foreground/45 font-mono mt-1">
                          Add-ons: {item.customizations.map((c: any) => `${c.name} (+${formatPrice(c.price)})`).join(", ")}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-full p-1">
                      <button
                        onClick={() => updateQuantity(item.uniqueKey, item.quantity - 1)}
                        className="w-7 h-7 rounded-full bg-white/5 hover:bg-gold/15 hover:text-gold text-foreground/70 flex items-center justify-center transition-all duration-250 active:scale-90"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-foreground text-xs font-heading font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.uniqueKey, item.quantity + 1)}
                        className="w-7 h-7 rounded-full bg-white/5 hover:bg-gold/15 hover:text-gold text-foreground/70 flex items-center justify-center transition-all duration-250 active:scale-90"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.uniqueKey)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-250 active:scale-90"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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

              {/* Special Instructions */}
              <div className="p-4 rounded-xl border border-white/5 bg-[#0b0b0b]/60 space-y-2">
                <label className="text-[10px] font-heading tracking-widest text-foreground/50 block uppercase">
                  Special Instructions
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Type requests (e.g. no onion, extra cheese)... NOTE: custom written requests require counter approval."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-gold/50 transition-colors placeholder:text-foreground/30 resize-none h-16 font-mono"
                />
              </div>

              {/* Discount Code */}
              <div className="p-4 rounded-xl border border-white/5 bg-[#0b0b0b]/60 space-y-2">
                <label className="text-[10px] font-heading tracking-widest text-foreground/50 block uppercase">
                  Discount Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCodeInput}
                    onChange={(e) => setDiscountCodeInput(e.target.value)}
                    placeholder="ENTER CODE"
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-foreground uppercase focus:outline-none focus:border-gold/50 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountError("");
                      if (!discountCodeInput.trim()) return;
                      const code = discountCodeInput.trim().toUpperCase();
                      const found = discountCodes.find(dc => dc.code === code);
                      if (found) {
                        setAppliedDiscount(found);
                        toast.success(`Discount "${code}" applied!`);
                      } else {
                        setDiscountError("Invalid code");
                        setAppliedDiscount(null);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-gold text-background text-xs font-bold font-heading hover:bg-gold/95"
                  >
                    Apply
                  </button>
                </div>
                {appliedDiscount && (
                  <p className="text-[10px] text-green-400">
                    ✓ Code "{appliedDiscount.code}" applied ({appliedDiscount.type === "percent" ? `${appliedDiscount.value}%` : `$${appliedDiscount.value}`} off)
                  </p>
                )}
                {discountError && <p className="text-[10px] text-red-400">✕ {discountError}</p>}
              </div>

              <div className="p-4 rounded-xl border border-white/5 bg-[#0b0b0b]/80 space-y-2 text-xs text-foreground/60">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax ({taxRate.toFixed(2)}%)</span>
                  <span className="text-foreground">{formatPrice(taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Charge ({serviceCharge.toFixed(2)}%)</span>
                  <span className="text-foreground">{formatPrice(serviceChargeAmount)}</span>
                </div>
                <div className="flex justify-between font-heading text-sm pt-2 border-t border-white/5 text-foreground">
                  <span>Total Amount</span>
                  <span className="text-gold font-bold">{formatPrice(grandTotal)}</span>
                </div>
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

      {/* Customization Selection Modal */}
      {customizingDish && (
        <Modal
          open={!!customizingDish}
          onClose={() => setCustomizingDish(null)}
          title={`Customize ${customizingDish.name}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-foreground/50">Select optional add-ons for your dish:</p>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {((customizingDish.metadata as any)?.customizations || []).map((addon: any, idx: number) => {
                const isSelected = selectedCustoms.some((c) => c.name === addon.name);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCustoms(prev => prev.filter(c => c.name !== addon.name));
                      } else {
                        setSelectedCustoms(prev => [...prev, { name: addon.name, price: Number(addon.price) }]);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border text-xs transition-all cursor-pointer",
                      isSelected
                        ? "border-gold bg-gold/10 text-gold font-medium"
                        : "border-white/10 hover:border-white/20 text-foreground/75"
                    )}
                  >
                    <span>{addon.name}</span>
                    <span className="text-gold font-semibold">+{formatPrice(addon.price)}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={() => setCustomizingDish(null)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-foreground/60 text-xs font-semibold hover:bg-white/10 hover:text-foreground transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  addItem(customizingDish.id, selectedCustoms);
                  toast.success(`Added ${customizingDish.name} to order`);
                  setCustomizingDish(null);
                }}
                className="px-4 py-2 rounded-xl bg-gold text-background font-heading text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Add to Order
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

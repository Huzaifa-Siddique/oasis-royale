"use client";

import { useEffect, useState } from "react";
import MenuCard from "@/components/ui/MenuCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Dish } from "@/lib/supabase-types";

export default function MenuClient() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dishes")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dishes");
        return res.json();
      })
      .then((data) => {
        setDishes(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleOrder = (dish: Dish) => {
    const cart = JSON.parse(localStorage.getItem("oasis_cart") || "[]");
    const existing = cart.find((item: { id: string }) => item.id === dish.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...dish, quantity: 1 });
    }
    localStorage.setItem("oasis_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const groupedDishes = dishes.reduce<Record<string, Dish[]>>((acc, dish) => {
    const category = dish.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(dish);
    return acc;
  }, {});

  return (
    <main className="min-h-screen pb-24">
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
              <Skeleton key={i} variant="card" className="h-64" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center text-red-400 py-12">
            <p className="text-xl">Something went wrong</p>
            <p className="text-foreground/50 mt-2">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {Object.entries(groupedDishes).map(([category, categoryDishes]) => (
              <div key={category} className="mb-12">
                <h2 className="font-heading text-2xl text-foreground mb-6">
                  {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryDishes.map((dish) => (
                    <MenuCard
                      key={dish.id}
                      dish={dish}
                      onOrder={handleOrder}
                    />
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(groupedDishes).length === 0 && (
              <div className="text-center text-foreground/50 py-12">
                <p className="text-xl">No dishes available</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

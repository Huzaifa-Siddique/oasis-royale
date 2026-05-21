"use client";

import { useEffect, useState } from "react";
import type { Dish } from "@/lib/supabase-types";
import ModelViewer from "@/components/ar/ModelViewer";
import { Modal } from "@/components/ui/Modal";

export default function Home() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  useEffect(() => {
    fetch("/api/dishes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDishes(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground/50">Loading...</p>
      </main>
    );
  }

  const dish = dishes[0];

  if (!dish) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground/50">No dishes available</p>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 shadow-xl">
        {dish.image_url && (
          <img
            src={dish.image_url}
            alt={dish.name}
            className="w-full h-48 object-cover rounded-xl mb-4"
          />
        )}
        <h2 className="text-xl font-semibold text-foreground">{dish.name}</h2>
        <p className="text-gold mt-1">${dish.price.toFixed(2)}</p>
        <button
          onClick={() => setSelectedDish(dish)}
          disabled={!dish.model_url}
          className="mt-4 w-full py-2.5 rounded-xl bg-gold text-black font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold/90 transition-colors"
        >
          View in AR
        </button>
      </div>

      <Modal
        open={!!selectedDish}
        onClose={() => setSelectedDish(null)}
        title={selectedDish?.name}
      >
        {selectedDish?.model_url ? (
          <div className="space-y-3">
            <ModelViewer
              src={selectedDish.model_url}
              alt={selectedDish.name}
              poster={selectedDish.poster_url || undefined}
              className="min-h-[400px]"
            />
            {selectedDish.poster_url && (
              <a
                href="/models/pizza.usdz"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-sm text-foreground/50 hover:text-foreground/80 transition-colors"
              >
                Open in iOS Quick Look
              </a>
            )}
          </div>
        ) : (
          <p className="text-foreground/50 text-center py-8">No 3D model available</p>
        )}
      </Modal>
    </main>
  );
}

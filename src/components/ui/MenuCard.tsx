"use client";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import type { Dish } from "@/lib/supabase-types";
import { ShoppingCart } from "lucide-react";

type MenuCardProps = {
  dish: Dish;
  onOrder: (dish: Dish) => void;
  className?: string;
};

export default function MenuCard({ dish, onOrder, className }: MenuCardProps) {
  return (
    <div
      className={cn(
        "glassmorphism rounded-2xl overflow-hidden group cursor-pointer",
        "transition-all duration-300 hover:scale-[1.02] hover:border-gold/30",
        !dish.is_available && "opacity-50 pointer-events-none",
        className
      )}
    >
      <div className="aspect-[4/3] bg-teal/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent z-10" />
        <div className="w-full h-full bg-gradient-to-br from-teal/20 to-gold/10 flex items-center justify-center">
          <span className="text-4xl">🍽️</span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg text-foreground">{dish.name}</h3>
          <span className="text-gold font-heading text-sm">
            {formatPrice(dish.price)}
          </span>
        </div>
        <p className="text-sm text-foreground/60 line-clamp-2">
          {dish.description}
        </p>
        <button
          onClick={() => onOrder(dish)}
          disabled={!dish.is_available}
          className="w-full mt-3 h-10 rounded-xl bg-gold/20 text-gold text-sm font-medium
                     flex items-center justify-center gap-2
                     transition-all duration-200 active:scale-[0.97]
                     hover:bg-gold/30 disabled:opacity-30"
        >
          <ShoppingCart className="w-4 h-4" />
          {dish.is_available ? "Add to Order" : "Unavailable"}
        </button>
      </div>
    </div>
  );
}

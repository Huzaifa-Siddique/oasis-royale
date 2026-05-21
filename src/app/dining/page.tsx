"use client";

import { useState } from "react";
import { DINING_ITEMS } from "@/lib/constants";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";

const categories = ["All", "Signature", "Starter", "Main", "Dessert"];

export default function DiningPage() {
  const [active, setActive] = useState("All");

  const filtered = active === "All" ? DINING_ITEMS : DINING_ITEMS.filter((i) => i.category === active);

  return (
    <>
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=1920"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
        <SectionHeader
          tag="Culinary Excellence"
          title="The Art of Dining"
          subtitle="A symphony of flavors orchestrated by world-renowned chefs, set against the backdrop of the desert."
        />
      </section>

      <Section>
        <div className="flex flex-wrap gap-3 mb-12 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-5 py-2 rounded-full text-xs font-heading tracking-wider uppercase transition-all duration-300 ${
                active === cat
                  ? "bg-gold text-background"
                  : "bg-transparent text-muted border border-border hover:border-gold/30 hover:text-gold"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="glass rounded-2xl overflow-hidden transition-all duration-500 hover:border-gold/30 group"
            >
              <div className="relative overflow-hidden aspect-[4/3]">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge variant="gold">{item.category}</Badge>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-base font-heading mb-1">{item.name}</h3>
                <p className="text-muted text-xs leading-relaxed mb-3">{item.description}</p>
                <p className="text-gold font-heading text-lg">${item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

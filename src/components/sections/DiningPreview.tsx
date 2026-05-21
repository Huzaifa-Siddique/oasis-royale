"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DINING_ITEMS } from "@/lib/constants";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function DiningPreview() {
  const items = DINING_ITEMS.slice(0, 4);

  return (
    <Section id="dining" background="gold">
      <SectionHeader
        tag="Culinary Excellence"
        title="A Feast for the Senses"
        subtitle="Our Michelin-starred chefs craft extraordinary dishes that blend tradition with avant-garde technique."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="glass rounded-2xl overflow-hidden transition-all duration-500 hover:border-gold/30 group"
          >
            <div className="relative overflow-hidden aspect-[4/3]">
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute top-3 left-3">
                <Badge variant="gold">{item.category}</Badge>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-base font-heading mb-1">{item.name}</h3>
              <p className="text-muted text-xs leading-relaxed mb-3 line-clamp-2">{item.description}</p>
              <p className="text-gold font-heading text-sm">${item.price}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-12">
        <Button variant="outline" size="lg" asChild>
          <Link href="/dining">
            Explore Full Menu
            <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
    </Section>
  );
}

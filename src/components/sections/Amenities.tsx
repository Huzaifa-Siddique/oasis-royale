"use client";

import { Droplets, Sparkles, UtensilsCrossed, Sun, Umbrella, Telescope } from "lucide-react";
import { AMENITIES } from "@/lib/constants";
import { Section, SectionHeader } from "@/components/ui/Section";

const iconMap: Record<string, React.ReactNode> = {
  Droplets: <Droplets size={24} />,
  Sparkles: <Sparkles size={24} />,
  UtensilsCrossed: <UtensilsCrossed size={24} />,
  Sun: <Sun size={24} />,
  Umbrella: <Umbrella size={24} />,
  Telescope: <Telescope size={24} />,
};

export function Amenities() {
  return (
    <Section id="amenities">
      <SectionHeader
        tag="Experiences"
        title="World-Class Amenities"
        subtitle="Every moment at Oasis Royale is designed to captivate your senses and elevate your spirit."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {AMENITIES.map((amenity) => (
          <div
            key={amenity.title}
            className="glass rounded-2xl p-8 transition-all duration-500 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/5 group"
          >
            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold mb-5 transition-transform duration-500 group-hover:scale-110">
              {iconMap[amenity.icon]}
            </div>
            <h3 className="text-lg font-heading mb-2">{amenity.title}</h3>
            <p className="text-muted text-sm leading-relaxed">{amenity.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

"use client";

import { Star } from "lucide-react";
import { TESTIMONIALS } from "@/lib/constants";
import { Section, SectionHeader } from "@/components/ui/Section";

export function Testimonials() {
  return (
    <Section background="alt">
      <SectionHeader
        tag="Press & Praise"
        title="Voices of Excellence"
        subtitle="What the world's most discerning travelers say about their stay at Oasis Royale."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="glass rounded-2xl p-8 transition-all duration-500 hover:border-gold/20">
            <div className="flex gap-1 mb-6">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} size={16} className="text-gold fill-gold" />
              ))}
            </div>
            <p className="text-foreground/80 text-sm leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
            <div>
              <p className="text-sm font-heading">{t.name}</p>
              <p className="text-xs text-muted">{t.role}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

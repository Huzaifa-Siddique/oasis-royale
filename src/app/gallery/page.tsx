"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { GALLERY_IMAGES } from "@/lib/constants";
import { Section, SectionHeader } from "@/components/ui/Section";

export default function GalleryPage() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <>
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
        <SectionHeader
          tag="Visual Journey"
          title="Our World in Pictures"
          subtitle="Every corner of Oasis Royale tells a story. Browse our visual narrative."
        />
      </section>

      <Section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GALLERY_IMAGES.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className="group relative overflow-hidden rounded-xl aspect-square"
            >
              <img
                src={img.src}
                alt={img.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/50 transition-all duration-500 flex items-end p-4">
                <p className="text-white text-sm font-heading opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  {img.title}
                </p>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {selected !== null && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <button
            onClick={() => setSelected(null)}
            className="absolute top-6 right-6 text-foreground hover:text-gold transition-colors"
            aria-label="Close"
          >
            <X size={32} />
          </button>
          <img
            src={GALLERY_IMAGES[selected].src}
            alt={GALLERY_IMAGES[selected].title}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-8 text-center text-sm text-muted">
            {GALLERY_IMAGES[selected].title}
          </p>
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
            {GALLERY_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(i);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === selected ? "bg-gold w-6" : "bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

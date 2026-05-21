"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GALLERY_IMAGES } from "@/lib/constants";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

export function GalleryPreview() {
  const images = GALLERY_IMAGES.slice(0, 4);

  return (
    <Section id="gallery">
      <SectionHeader
        tag="Visual Journey"
        title="Moments Captured"
        subtitle="Step into a world of elegance through our curated visual collection."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {images.map((img) => (
          <div key={img.title} className="relative overflow-hidden rounded-xl aspect-square group">
            <img
              src={img.src}
              alt={img.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-all duration-500 flex items-end p-4">
              <p className="text-white text-xs font-heading opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                {img.title}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-12">
        <Button variant="outline" size="lg" asChild>
          <Link href="/gallery">
            View Full Gallery
            <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
    </Section>
  );
}

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/Button";
import GlassCard from "@/components/ui/GlassCard";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export default function MenuSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".menu-heading",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power4.out",
          scrollTrigger: { trigger: ".menu-heading", start: "top 80%" },
        }
      );
      gsap.fromTo(
        ".menu-card",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power4.out",
          scrollTrigger: { trigger: ".menu-card", start: "top 85%" },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const categories = [
    { name: "Signature Cocktails", items: 8, icon: "🍸" },
    { name: "Grilled Specialties", items: 12, icon: "🥩" },
    { name: "Desert Platters", items: 6, icon: "🍰" },
    { name: "Exotic Beverages", items: 10, icon: "🧋" },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-6 max-w-7xl mx-auto"
    >
      <div className="text-center mb-16 menu-heading">
        <span className="text-gold text-sm font-heading tracking-[0.2em] uppercase">
          Curated Excellence
        </span>
        <h2 className="font-heading text-3xl md:text-5xl text-foreground mt-3 mb-4">
          Our Menu
        </h2>
        <p className="text-foreground/60 max-w-xl mx-auto">
          Each dish is crafted with precision, blending tradition with
          innovation to create an unforgettable culinary journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {categories.map((cat) => (
          <GlassCard
            key={cat.name}
            className="menu-card text-center hover:border-gold/20 transition-colors"
          >
            <span className="text-3xl block mb-3">{cat.icon}</span>
            <h3 className="font-heading text-lg text-foreground mb-1">
              {cat.name}
            </h3>
            <p className="text-sm text-foreground/50">{cat.items} Items</p>
          </GlassCard>
        ))}
      </div>

      <div className="text-center menu-card">
        <Link href="/menu">
          <Button variant="primary" size="lg">
            View Full Menu
          </Button>
        </Link>
      </div>
    </section>
  );
}

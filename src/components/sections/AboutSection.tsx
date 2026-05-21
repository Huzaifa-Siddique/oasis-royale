"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GlassCard from "@/components/ui/GlassCard";

gsap.registerPlugin(ScrollTrigger);

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".about-content",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power4.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 px-6 max-w-7xl mx-auto"
    >
      <div className="about-content grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-gold text-sm font-heading tracking-[0.2em] uppercase">
            Our Story
          </span>
          <h2 className="font-heading text-3xl md:text-5xl text-foreground mt-3 mb-6">
            Where the Desert Meets Elegance
          </h2>
          <p className="text-foreground/60 leading-relaxed mb-6">
            Nestled in the heart of an oasis, Oasis Royale brings you a dining
            experience that transcends the ordinary. Our chefs draw inspiration
            from the rich tapestry of desert cultures, crafting dishes that
            tell stories of ancient trade routes and modern sophistication.
          </p>
          <p className="text-foreground/60 leading-relaxed">
            Every ingredient is carefully sourced, every plate thoughtfully
            composed. We believe dining is not just about food — it is about
            creating moments that linger long after the last bite.
          </p>
        </div>
        <GlassCard className="aspect-square relative overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-gold/10 via-teal/5 to-transparent flex items-center justify-center">
            <span className="text-8xl opacity-30">✦</span>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}

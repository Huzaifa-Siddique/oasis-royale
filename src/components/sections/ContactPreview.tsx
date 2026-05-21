"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Phone, Mail } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

export function ContactPreview() {
  return (
    <Section background="alt">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div>
          <p className="text-gold font-heading text-xs tracking-[0.2em] uppercase mb-4">Get in Touch</p>
          <h2 className="text-3xl md:text-5xl font-heading leading-tight mb-6">
            Your Journey Begins Here
          </h2>
          <p className="text-muted text-lg mb-8 text-balance">
            Our concierge team is ready to craft your perfect desert escape. Reach out and let us create magic.
          </p>
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4">
              <MapPin size={18} className="text-gold shrink-0" />
              <span className="text-sm text-muted">Al Wadi Desert, Dubai, UAE</span>
            </div>
            <div className="flex items-center gap-4">
              <Phone size={18} className="text-gold shrink-0" />
              <a href="tel:+971500000000" className="text-sm text-muted hover:text-foreground transition-colors">
                +971 50 000 0000
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Mail size={18} className="text-gold shrink-0" />
              <a
                href="mailto:reservations@oasisroyale.com"
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                reservations@oasisroyale.com
              </a>
            </div>
          </div>
          <Button variant="primary" size="lg" asChild>
            <Link href="/contact">
              Contact Us
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
        <div className="glass rounded-2xl overflow-hidden aspect-[4/3]">
          <img
            src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800"
            alt="Oasis Royale exterior"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </Section>
  );
}

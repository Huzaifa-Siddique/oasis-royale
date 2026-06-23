"use client";

import { useEffect, useState } from "react";
import type { Dish } from "@/lib/supabase-types";
import { Section, SectionHeader } from "@/components/ui/Section";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import MenuCard from "@/components/ui/MenuCard";
import Link from "next/link";
import { Smartphone, ChefHat, ScanLine, CreditCard, Sparkles } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/api-fetch";

const steps = [
  {
    icon: ScanLine,
    title: "Browse Menu",
    desc: "Guests scan a QR code to view your full menu with dish photos, descriptions, and prices.",
  },
  {
    icon: Smartphone,
    title: "Order from Phone",
    desc: "Select items and submit directly to the kitchen. No app download needed — it works in the browser.",
  },
  {
    icon: ChefHat,
    title: "Kitchen Receives Instantly",
    desc: "Orders appear in real time on the kitchen display. Staff accepts, prepares, and marks ready.",
  },
  {
    icon: CreditCard,
    title: "Pay at Counter",
    desc: "Customers pay on your existing POS or Mada terminal. Counter staff marks the order as paid.",
  },
];

export default function HomePage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const router = useRouter();

  // Floating amber embers array for cinematic desert noir atmosphere
  const embers = [
    { id: 1, left: "10%", bottom: "-5%", width: "8px", height: "8px", delay: "0s", duration: "12s" },
    { id: 2, left: "25%", bottom: "-10%", width: "6px", height: "6px", delay: "2s", duration: "14s" },
    { id: 3, left: "40%", bottom: "-12%", width: "12px", height: "12px", delay: "4s", duration: "16s" },
    { id: 4, left: "55%", bottom: "-8%", width: "5px", height: "5px", delay: "1s", duration: "11s" },
    { id: 5, left: "70%", bottom: "-5%", width: "10px", height: "10px", delay: "6s", duration: "15s" },
    { id: 6, left: "85%", bottom: "-15%", width: "7px", height: "7px", delay: "3s", duration: "13s" },
    { id: 7, left: "18%", bottom: "-8%", width: "9px", height: "9px", delay: "5s", duration: "17s" },
    { id: 8, left: "48%", bottom: "-10%", width: "6px", height: "6px", delay: "7s", duration: "12s" },
    { id: 9, left: "62%", bottom: "-6%", width: "11px", height: "11px", delay: "1.5s", duration: "14s" },
    { id: 10, left: "78%", bottom: "-12%", width: "8px", height: "8px", delay: "8.5s", duration: "13s" },
  ];

  useEffect(() => {
    fetch("/api/dishes", { headers: { ...authHeaders() } })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDishes(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleOrder = (dish: Dish) => {
    addItem(dish.id);
    toast.success("Added to order");
    router.push("/order");
  };

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 pt-28 pb-12 md:pt-36 md:pb-20 overflow-hidden">
        {/* Soft radial ambient lighting backlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(17,75,95,0.08)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-background pointer-events-none" />
        
        {/* Cinematic floating embers */}
        {embers.map((ember) => (
          <div
            key={ember.id}
            className="glow-particle"
            style={{
              left: ember.left,
              bottom: ember.bottom,
              width: ember.width,
              height: ember.height,
              animationDelay: ember.delay,
              animationDuration: ember.duration,
            }}
          />
        ))}

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-heading tracking-wider uppercase mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Restaurant Digital Menu Platform
          </div>
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl text-foreground leading-tight mb-6 text-balance">
            Digital Menu.
            <br />
            <span className="text-gold">Smarter Service.</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto mb-10 text-balance">
            Let guests browse your menu in AR, order from their phone, and pay at the counter.
            Your kitchen sees every order in real time. No app, no hardware, no hassle.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="#menu">
              <Button variant="primary" size="lg" className="shimmer-button rounded-full px-10 py-4 font-semibold cursor-pointer">
                View Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <Section background="alt" id="how-it-works">
        <SectionHeader
          tag="How It Works"
          title="From Menu to Kitchen in Seconds"
          subtitle="No app downloads. No new hardware. Your restaurant runs smoother from the moment a guest walks in."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <GlassCard key={step.title} className="text-center">
              <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-5">
                <step.icon className="w-7 h-7 text-gold" />
              </div>
              <span className="text-xs text-gold font-heading tracking-wider uppercase mb-2 block">
                Step {i + 1}
              </span>
              <h3 className="font-heading text-lg text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-foreground/60 leading-relaxed">{step.desc}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      {/* Menu */}
      <Section id="menu">
        <SectionHeader
          tag="Our Menu"
          title="Explore Our Dishes"
          subtitle="Tap any dish to add it to your order. View in AR for a full 3D preview."
        />
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glassmorphism rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-white/5 rounded w-3/4" />
                  <div className="h-4 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : dishes.length === 0 ? (
          <p className="text-center text-foreground/40 py-20">No dishes available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dishes.map((dish) => (
              <MenuCard key={dish.id} dish={dish} onOrder={handleOrder} />
            ))}
          </div>
        )}
        <div className="text-center mt-12">
          <Link href="/menu">
            <Button variant="primary" size="lg">
              Full Menu & Ordering
            </Button>
          </Link>
        </div>
      </Section>

      {/* CTA */}
      <Section background="gold">
        <div className="text-center max-w-2xl mx-auto">
          <SectionHeader
            tag="Get Started"
            title="Ready to Transform Your Restaurant?"
            subtitle="Set up in minutes. No hardware, no contracts, no commitment. Pay only when you're satisfied."
          />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/menu">
              <Button variant="primary" size="lg">
                Try the Demo
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}

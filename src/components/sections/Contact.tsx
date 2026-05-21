"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Button, Input, Badge } from "@/components/ui";

gsap.registerPlugin(ScrollTrigger);

const contactInfo = [
  { icon: Phone, label: "Phone", value: "+1 (555) 123-4567" },
  { icon: Mail, label: "Email", value: "stay@oasisroyale.com" },
  { icon: MapPin, label: "Address", value: "Desert Oasis, Sector 7" },
  { icon: Clock, label: "Check-in / Check-out", value: "3:00 PM / 12:00 PM" },
];

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current?.children ?? [],
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          scrollTrigger: {
            trigger: contentRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 sm:py-32" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={contentRef} className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <Badge variant="info" className="mb-4">GET IN TOUCH</Badge>
            <h2 className="text-3xl sm:text-5xl font-heading text-foreground mb-4">
              Reserve Your <span className="text-gold">Escape</span>
            </h2>
            <p className="text-foreground/50 mb-10 max-w-md text-lg font-light">
              Whether you&apos;re planning a romantic getaway or a grand celebration, our concierge team is ready to craft your perfect stay.
            </p>

            <div className="space-y-5">
              {contactInfo.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <div className="text-xs text-foreground/40 uppercase tracking-wider">{item.label}</div>
                      <div className="text-sm text-foreground/80 mt-0.5">{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-[#0A0A0A] border border-white/5 p-8">
            <h3 className="text-lg font-heading text-foreground mb-6">Send a Message</h3>
            <form className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input id="name" label="Name" placeholder="Your name" />
                <Input id="email" label="Email" type="email" placeholder="your@email.com" />
              </div>
              <Input id="subject" label="Subject" placeholder="How can we help?" />
              <div className="space-y-1.5">
                <label htmlFor="message" className="block text-sm font-medium text-foreground/80">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all duration-200 resize-none"
                  placeholder="Tell us about your stay..."
                />
              </div>
              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

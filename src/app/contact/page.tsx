"use client";

import { useState, type FormEvent } from "react";
import { MapPin, Phone, Mail, Send } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1920"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
        <SectionHeader
          tag="Get in Touch"
          title="Reserve Your Escape"
          subtitle="Our concierge team is ready to craft the perfect desert experience for you."
        />
      </section>

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            {submitted ? (
              <div className="glass rounded-3xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-6">
                  <Send size={28} className="text-gold" />
                </div>
                <h2 className="text-2xl font-heading mb-4">Thank You</h2>
                <p className="text-muted">
                  Your message has been received. Our concierge team will respond within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input label="First Name" id="firstName" placeholder="John" required />
                  <Input label="Last Name" id="lastName" placeholder="Doe" required />
                </div>
                <Input label="Email" id="email" type="email" placeholder="john@example.com" required />
                <Input label="Phone" id="phone" type="tel" placeholder="+1 234 567 890" />
                <Input label="Subject" id="subject" placeholder="Reservation Inquiry" />
                <Textarea
                  label="Message"
                  id="message"
                  rows={5}
                  placeholder="Tell us about your vision for the perfect stay..."
                  required
                />
                <Button variant="primary" size="lg" type="submit" className="w-full">
                  <Send size={16} />
                  Send Message
                </Button>
              </form>
            )}
          </div>

          <div>
            <div className="glass rounded-3xl p-8 md:p-12 space-y-8">
              <div>
                <h3 className="font-heading text-sm tracking-wider uppercase text-gold mb-6">
                  Contact Information
                </h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <MapPin size={20} className="text-gold shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-muted">Al Wadi Desert</p>
                      <p className="text-sm text-muted">Dubai, United Arab Emirates</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone size={20} className="text-gold shrink-0 mt-0.5" />
                    <div>
                      <a
                        href="tel:+971500000000"
                        className="text-sm text-muted hover:text-foreground transition-colors"
                      >
                        +971 50 000 0000
                      </a>
                      <p className="text-xs text-muted/60">24/7 Concierge</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Mail size={20} className="text-gold shrink-0 mt-0.5" />
                    <div>
                      <a
                        href="mailto:reservations@oasisroyale.com"
                        className="text-sm text-muted hover:text-foreground transition-colors"
                      >
                        reservations@oasisroyale.com
                      </a>
                      <p className="text-xs text-muted/60">We reply within 24 hours</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-8">
                <h3 className="font-heading text-sm tracking-wider uppercase text-gold mb-4">
                  Location
                </h3>
                <div className="glass rounded-xl overflow-hidden aspect-[16/9]">
                  <img
                    src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800"
                    alt="Map location"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

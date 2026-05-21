"use client";

import { Section } from "@/components/ui/Section";

const stats = [
  { value: "250+", label: "Luxury Suites" },
  { value: "3", label: "Michelin Stars" },
  { value: "12", label: "Signature Experiences" },
  { value: "99.9%", label: "Guest Satisfaction" },
];

export function Stats() {
  return (
    <Section>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-3xl md:text-5xl font-heading gradient-gold mb-2">{stat.value}</p>
            <p className="text-muted text-sm font-heading tracking-wider uppercase">{stat.label}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

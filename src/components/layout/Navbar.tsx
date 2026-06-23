"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled ? "glass-strong" : "bg-transparent",
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
              <span className="text-background font-heading text-sm font-bold">OR</span>
            </div>
            <span className="font-heading text-lg tracking-widest hidden sm:block text-foreground">
              OASIS ROYALE
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted hover:text-gold transition-colors duration-300 font-heading tracking-wider uppercase"
              >
                {link.label}
              </Link>
            ))}
            <Button variant="primary" size="sm" asChild>
              <Link href="/rooms">Book Now</Link>
            </Button>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-foreground p-2"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 transition-all duration-500 md:hidden",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none",
        )}
      >
        {NAV_LINKS.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setIsOpen(false)}
            className="text-2xl font-heading tracking-widest uppercase text-foreground hover:text-gold transition-colors"
            style={{ transitionDelay: isOpen ? `${i * 50}ms` : "0ms" }}
          >
            {link.label}
          </Link>
        ))}
        <Button variant="primary" size="lg" className="mt-4" asChild>
          <Link href="/rooms" onClick={() => setIsOpen(false)}>Book Now</Link>
        </Button>
      </div>
    </header>
  );
}

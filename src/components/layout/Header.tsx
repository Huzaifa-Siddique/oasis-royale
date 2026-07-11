"use client";

import Link from "next/link";
import { Menu, X, User, ChevronDown, Calculator, Send, ChefHat, LayoutDashboard } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import CartBadge from "@/components/ui/CartBadge";
import { cn } from "@/lib/utils";

function DashboardDropdown({ role }: { role: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 text-sm text-gold hover:text-gold/80 transition-colors"
      >
        Dashboard
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-40 z-[60] glassmorphism border border-white/10 rounded-lg py-2 shadow-xl">
          <Link
            href="/counter"
            onClick={close}
            className="block px-4 py-2 text-sm text-foreground/70 hover:text-gold hover:bg-white/5 transition-colors"
          >
            Counter
          </Link>
          <Link
            href="/dispatch"
            onClick={close}
            className="block px-4 py-2 text-sm text-foreground/70 hover:text-gold hover:bg-white/5 transition-colors"
          >
            Dispatch
          </Link>
          <Link
            href="/kitchen"
            onClick={close}
            className="block px-4 py-2 text-sm text-foreground/70 hover:text-gold hover:bg-white/5 transition-colors"
          >
            Kitchen
          </Link>
          {role === "admin" && (
            <Link
              href="/admin"
              onClick={close}
              className="block px-4 py-2 text-sm text-foreground/70 hover:text-gold hover:bg-white/5 transition-colors"
            >
              Admin
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/order", label: "Order" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [mobileDashboardOpen, setMobileDashboardOpen] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const { role, profile, signOut } = useAuth();
  
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  const isStaff = role === "staff" || role === "admin";

  useEffect(() => {
    const sid = localStorage.getItem("oasis_order_session_id");
    setHasActiveOrder(!!sid);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-4 left-4 right-4 mx-auto max-w-5xl z-50 transition-all duration-300 transform",
        visible ? "translate-y-0" : "-translate-y-28",
        "glassmorphism border border-white/10 shadow-lg px-4",
        open ? "rounded-[24px]" : "rounded-full"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
        <Link href="/" className="font-heading text-xl text-gold tracking-wider">
          OASIS ROYALE
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.href === "/order" ? (
              <div key={link.href} className="relative">
                <Link
                  href={link.href}
                  className="text-sm text-foreground/70 hover:text-gold transition-colors"
                >
                  {link.label}
                </Link>
                <CartBadge />
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-foreground/70 hover:text-gold transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
          {hasActiveOrder && (
            <Link
              href="/order/track"
              className="text-sm text-foreground/70 hover:text-gold transition-colors"
            >
              Track Order
            </Link>
          )}
          {isStaff && <DashboardDropdown role={role} />}
          <Link href="/profile" className="text-foreground/50 hover:text-gold transition-colors">
            <User className="w-4 h-4" />
          </Link>
          {profile && (
            <button
              onClick={signOut}
              className="text-xs text-foreground/40 hover:text-gold transition-colors"
            >
              Logout
            </button>
          )}
        </nav>
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-foreground p-2"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden glassmorphism border-t border-white/5 px-6 py-4 space-y-3">
          {navLinks.map((link) =>
            link.href === "/order" ? (
              <div key={link.href} className="relative inline-block">
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block text-foreground/70 hover:text-gold transition-colors"
                >
                  {link.label}
                </Link>
                <CartBadge />
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block text-foreground/70 hover:text-gold transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
          {hasActiveOrder && (
            <Link
              href="/order/track"
              onClick={() => setOpen(false)}
              className="block text-foreground/70 hover:text-gold transition-colors"
            >
              Track Order
            </Link>
          )}
          {isStaff && (
            <div className="space-y-2 py-1">
              <button
                type="button"
                onClick={() => setMobileDashboardOpen(!mobileDashboardOpen)}
                className="flex items-center justify-between text-gold hover:text-gold/80 transition-all cursor-pointer w-full text-left font-semibold py-1.5"
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-gold" />
                  Dashboard Menu
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-250", mobileDashboardOpen && "rotate-180")} />
              </button>
              {mobileDashboardOpen && (
                <div className="pl-3 mt-1.5 space-y-2 border-l border-white/10 ml-2">
                  <Link
                    href="/counter"
                    onClick={() => { setOpen(false); setMobileDashboardOpen(false); }}
                    className="flex items-center gap-2.5 text-foreground/70 hover:text-gold transition-colors text-sm py-2 px-2.5 rounded-lg hover:bg-white/5"
                  >
                    <Calculator className="w-4 h-4 text-gold/60" />
                    <span>Counter Dashboard</span>
                  </Link>
                  <Link
                    href="/dispatch"
                    onClick={() => { setOpen(false); setMobileDashboardOpen(false); }}
                    className="flex items-center gap-2.5 text-foreground/70 hover:text-gold transition-colors text-sm py-2 px-2.5 rounded-lg hover:bg-white/5"
                  >
                    <Send className="w-4 h-4 text-gold/60" />
                    <span>Dispatch Queue</span>
                  </Link>
                  <Link
                    href="/kitchen"
                    onClick={() => { setOpen(false); setMobileDashboardOpen(false); }}
                    className="flex items-center gap-2.5 text-foreground/70 hover:text-gold transition-colors text-sm py-2 px-2.5 rounded-lg hover:bg-white/5"
                  >
                    <ChefHat className="w-4 h-4 text-gold/60" />
                    <span>Kitchen Dashboard</span>
                  </Link>
                  {role === "admin" && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => { setOpen(false); setMobileDashboardOpen(false); }}
                      className="flex items-center gap-2.5 text-foreground/70 hover:text-gold transition-colors text-sm py-2 px-2.5 rounded-lg hover:bg-white/5"
                    >
                      <LayoutDashboard className="w-4 h-4 text-gold/60" />
                      <span>Admin Analytics</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block text-foreground/70 hover:text-gold transition-colors"
          >
            Profile
          </Link>
          {profile && (
            <button
              onClick={() => { signOut(); setOpen(false); }}
              className="block text-foreground/40 hover:text-gold transition-colors text-sm"
            >
              Logout
            </button>
          )}
          {!profile && (
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="block text-foreground/40 hover:text-gold transition-colors text-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}





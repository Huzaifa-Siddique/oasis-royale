"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, ClipboardList, ShoppingCart, Utensils, User, LayoutDashboard, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import CartBadge from "@/components/ui/CartBadge";

const baseItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/menu", label: "Menu", icon: ClipboardList },
  { href: "/order", label: "Order", icon: ShoppingCart },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const { role } = useAuth();

  const navItems =
    role === "admin"
      ? [
          ...baseItems.slice(0, 3),
          { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
          baseItems[3],
        ]
      : baseItems;

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-[#0A0A0A]/85 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-gold/5 max-w-lg mx-auto transition-all duration-300">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 xs:px-3 py-1 rounded-xl transition-all duration-250",
                "active:scale-90",
                active
                  ? "text-gold font-semibold scale-105 filter drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]"
                  : "text-foreground/50 hover:text-foreground/80"
              )}
            >
              <div className="relative flex items-center justify-center">
                <item.icon className={cn("w-4.5 h-4.5 xs:w-5 xs:h-5 transition-transform", active && "stroke-[2.5px]")} />
                {item.href === "/order" && <CartBadge />}
              </div>
              <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-heading tracking-wider uppercase scale-[0.9] sm:scale-100 sm:tracking-widest">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

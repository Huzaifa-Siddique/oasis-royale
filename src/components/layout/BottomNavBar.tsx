"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, ClipboardList, ShoppingCart, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/menu", label: "Menu", icon: ClipboardList },
  { href: "/order", label: "Order", icon: ShoppingCart },
  { href: "/kitchen", label: "Kitchen", icon: Utensils },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glassmorphism border-t border-white/5">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all",
                "active:scale-90",
                active
                  ? "text-gold"
                  : "text-foreground/50 hover:text-foreground/80"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

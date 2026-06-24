"use client";

import { ChefHat, ShoppingCart } from "lucide-react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";

function StaffHubContent() {
  const { profile } = useAuth();

  return (
    <main className="min-h-screen bg-[#050505] pt-28 sm:pt-32">
      <div className="max-w-4xl mx-auto px-6 py-6 sm:py-12">
        <div className="mb-10">
          <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-2">Staff Hub</h1>
          <p className="text-foreground/40 text-sm">
            Welcome back{profile?.email ? `, ${profile.email.replace(/(.{3})(.*)(@.*)/, "$1***$3")}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/kitchen" className="group block">
            <GlassCard className="!p-8 transition-all duration-300 group-hover:border-gold/40 group-hover:scale-[1.02]">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                  <ChefHat className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <h2 className="font-heading text-xl text-foreground mb-2">Kitchen Dashboard</h2>
                  <p className="text-foreground/50 text-sm leading-relaxed">
                    View and manage incoming orders. Mark items as ready and track preparation status.
                  </p>
                </div>
                <span className="text-xs text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Kitchen →
                </span>
              </div>
            </GlassCard>
          </Link>

          <Link href="/counter" className="group block">
            <GlassCard className="!p-8 transition-all duration-300 group-hover:border-gold/40 group-hover:scale-[1.02]">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <h2 className="font-heading text-xl text-foreground mb-2">Counter Order</h2>
                  <p className="text-foreground/50 text-sm leading-relaxed">
                    Create orders for walk-in customers. Process pending QR orders and accept payments.
                  </p>
                </div>
                <span className="text-xs text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Counter →
                </span>
              </div>
            </GlassCard>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function StaffPage() {
  return (
    <ProtectedRoute allowedRoles={["staff", "admin"]}>
      <StaffHubContent />
    </ProtectedRoute>
  );
}

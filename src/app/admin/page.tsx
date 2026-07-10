import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import GlassCard from "@/components/ui/GlassCard";

export default function AdminPage() {
  return (
    <Section>
      <div className="pt-32 pb-16">
        <SectionHeader
          tag="Administration"
          title="Staff Portal"
          subtitle="Demo and configure the Oasis Royale restaurant platforms."
        />
        <div className="max-w-md mx-auto px-4 mt-8">
          <p className="text-foreground/50 text-center mb-6 max-w-lg mx-auto text-sm">
            Access the administrative system to manage the menu, view analytics, and adjust operational settings.
          </p>

          <GlassCard className="flex flex-col justify-between p-6 border-gold/25 hover:border-gold/45 transition-all space-y-4 relative overflow-hidden bg-gradient-to-br from-gold/5 to-transparent">
            <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] text-gold font-bold uppercase tracking-wider bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
              <Sparkles className="w-2.5 h-2.5" />
              Premium Suite
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-gold font-heading tracking-widest uppercase px-2 py-0.5 rounded bg-gold/15 border border-gold/20">
                Full Suite Tier
              </span>
              <h3 className="font-heading text-lg text-foreground mt-2">Advanced Enterprise Suite</h3>
              <p className="text-xs text-foreground/50 leading-relaxed">
                Unlock high-performance kitchen dispatch modules, interactive tables heatmap grids, automated food wastage/revenue leakage analytics, time trends, and customized storefront branding options.
              </p>
            </div>
            <Button variant="primary" className="w-full justify-center gap-2 mt-4" asChild>
              <Link href="/admin/dashboard">
                Access Premium Suite
                <ArrowRight size={14} />
              </Link>
            </Button>
          </GlassCard>
        </div>
      </div>
    </Section>
  );
}


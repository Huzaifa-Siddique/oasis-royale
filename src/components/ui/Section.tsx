import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  background?: "default" | "alt" | "gold";
}

export function Section({ children, className, id, background = "default" }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-20 md:py-32 px-4 md:px-8 lg:px-16",
        background === "alt" && "bg-surface-alt",
        background === "gold" && "bg-gradient-to-b from-gold/5 via-transparent to-transparent",
        className,
      )}
    >
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}

export function SectionHeader({
  title,
  subtitle,
  tag,
  className,
  align = "center",
}: {
  title: string;
  subtitle?: string;
  tag?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "max-w-3xl mb-16 md:mb-20",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {tag && (
        <p className="text-gold font-heading text-xs tracking-[0.2em] uppercase mb-4">{tag}</p>
      )}
      <h2
        className={cn(
          "text-3xl md:text-5xl font-heading text-balance leading-tight mb-4",
          align === "center" ? "mx-auto" : "",
        )}
      >
        {title}
      </h2>
      {subtitle && <p className="text-muted text-lg md:text-xl max-w-2xl text-balance">{subtitle}</p>}
    </div>
  );
}

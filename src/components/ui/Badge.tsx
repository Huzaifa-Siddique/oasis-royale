import { cn } from "@/lib/utils";

type BadgeProps = {
  variant?: "default" | "info" | "success" | "warning";
  className?: string;
  children: React.ReactNode;
};

export default function Badge({
  variant = "default",
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
        variant === "default" && "bg-white/5 text-foreground/60",
        variant === "info" && "bg-gold/10 text-gold",
        variant === "success" && "bg-emerald-500/10 text-emerald-400",
        variant === "warning" && "bg-amber-500/10 text-amber-400",
        className
      )}
    >
      {children}
    </span>
  );
}

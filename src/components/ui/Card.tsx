import { cn } from "@/lib/utils";

type CardProps = {
  variant?: "default" | "elevated";
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export default function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-5",
        variant === "default" &&
          "bg-[#0A0A0A] border border-white/5",
        variant === "elevated" &&
          "glassmorphism",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

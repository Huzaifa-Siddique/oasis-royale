import { cn } from "@/lib/utils";

type GlassCardProps = {
  className?: string;
  children: React.ReactNode;
  as?: "div" | "section" | "article";
} & React.HTMLAttributes<HTMLDivElement>;

export default function GlassCard({
  className,
  children,
  as: Tag = "div",
  ...props
}: GlassCardProps) {
  return (
    <Tag
      className={cn(
        "glassmorphism rounded-2xl p-6",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

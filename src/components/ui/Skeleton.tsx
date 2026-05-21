import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "card" | "image";
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "text", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse rounded-lg bg-white/5",
          variant === "text" && "h-4 w-full",
          variant === "card" && "h-48 w-full rounded-2xl",
          variant === "image" && "aspect-[16/9] w-full rounded-2xl",
          className,
        )}
        {...props}
      />
    );
  },
);

Skeleton.displayName = "Skeleton";
export { Skeleton, type SkeletonProps };

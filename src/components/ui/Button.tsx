"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-heading tracking-widest uppercase transition-all duration-300",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "active:scale-[0.97]",
          variant === "primary" &&
            "bg-gold text-background hover:bg-gold-light hover:shadow-lg hover:shadow-gold/20",
          variant === "secondary" &&
            "bg-teal text-foreground hover:bg-teal-light hover:shadow-lg hover:shadow-teal/20",
          variant === "ghost" &&
            "bg-transparent text-foreground border border-border hover:bg-white/5 hover:border-border-hover",
          variant === "outline" &&
            "bg-transparent text-gold border border-gold/40 hover:bg-gold/10 hover:border-gold",
          size === "sm" && "px-4 py-2 text-xs gap-2",
          size === "md" && "px-6 py-3 text-sm gap-2",
          size === "lg" && "px-8 py-4 text-base gap-3",
          className,
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
export { Button };

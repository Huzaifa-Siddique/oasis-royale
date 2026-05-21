import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type InputProps = {
  label?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-foreground/80"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border border-white/10 bg-[#0A0A0A]",
            "px-4 py-2.5 text-sm text-foreground",
            "placeholder:text-foreground/40",
            "focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30",
            "transition-all",
            error && "border-red-500/50",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
export type { InputProps };

import { cn } from "@/lib/utils";

type CardProps = {
  variant?: "default" | "elevated";
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export function Card({ variant = "default", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-5",
        variant === "default" && "bg-[#0A0A0A] border border-white/5",
        variant === "elevated" && "glassmorphism",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type CardImageProps = React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string };

export function CardImage({ src, alt, className, ...props }: CardImageProps) {
  return (
    <div className={cn("w-full overflow-hidden rounded-md mb-4", className)}>
      <img src={src} alt={alt} className="w-full h-full object-cover" {...props} />
    </div>
  );
}

type CardContentProps = React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode };

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn("w-full", className)} {...props}>
      {children}
    </div>
  );
}

export default Card;

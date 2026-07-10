"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { cn, formatPrice } from "@/lib/utils";
import type { Dish } from "@/lib/supabase-types";
import { ShoppingCart, AlertCircle, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { arSingleton, ARState } from "@/lib/ar-singleton";
import { useCardVirtualization } from "@/hooks/useCardVirtualization";
import { canActivateAR, launchAR } from "@/lib/ar";

type MenuCardProps = {
  dish?: Dish;
  loading?: boolean;
  error?: string;
  onOrder?: (dish: Dish) => void;
  onRetry?: () => void;
  className?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (dishId: string) => void;
};

function MenuCard({
  dish,
  loading,
  error,
  onOrder,
  onRetry,
  className,
  isFavorite = false,
  onToggleFavorite,
}: MenuCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [arState, setArState] = useState<ARState>("idle");
  const [arSupported, setArSupported] = useState(false);
  
  const [isAdded, setIsAdded] = useState(false);
  
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Check AR support on mount
  useEffect(() => {
    let cancelled = false;
    canActivateAR().then((supported) => {
      if (!cancelled) setArSupported(supported);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cleanup active model-viewer container if card unmounts
  useEffect(() => {
    return () => {
      if (canvasContainerRef.current && arSingleton.getActiveContainer() === canvasContainerRef.current) {
        arSingleton.detach();
      }
    };
  }, []);

  // Garbage collection handler for offscreen virtualization
  const handleGcTrigger = useCallback(() => {
    if (arState !== "idle" && canvasContainerRef.current && arSingleton.getActiveContainer() === canvasContainerRef.current) {
      arSingleton.detach();
    }
  }, [arState]);

  const handleOrderClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!dish || !onOrder) return;
      onOrder(dish);
      setIsAdded(true);
    },
    [dish, onOrder]
  );

  useEffect(() => {
    if (!isAdded) return;
    const timer = setTimeout(() => setIsAdded(false), 1500);
    return () => clearTimeout(timer);
  }, [isAdded]);

  const { ref: cardRef, isNearViewport } = useCardVirtualization({
    onGcTrigger: handleGcTrigger,
  });

  const start3DInteraction = useCallback(async () => {
    if (!dish || !dish.model_url || !canvasContainerRef.current) return;
    try {
      await arSingleton.attachTo(
        canvasContainerRef.current,
        {
          src: dish.model_url,
          poster: dish.poster_url,
          iosSrc: dish.ios_src,
          alt: dish.name,
        },
        (state) => {
          setArState(state);
        }
      );
    } catch (err) {
      setArState("error");
    }
  }, [dish]);

  if (loading) {
    return (
      <div className={cn("glassmorphism rounded-2xl overflow-hidden flex flex-col h-full", className)}>
        <Skeleton variant="image" className="aspect-[4/3] !rounded-none" />
        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <Skeleton variant="text" className="h-5 w-2/3" />
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-4 w-1/2" />
          </div>
          <Skeleton variant="text" className="h-11 w-full !rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !dish) {
    return (
      <div
        className={cn(
          "glassmorphism rounded-2xl overflow-hidden flex flex-col items-center justify-center p-8 min-h-[320px] text-center h-full",
          className
        )}
      >
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-foreground/60 text-sm mb-4">
          {error || "Dish unavailable"}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/20 text-gold text-sm font-medium hover:bg-gold/30 transition-all active:scale-95"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  const showImage = !!dish.image_url && !imageError;
  const isInteractive = arState === "ready";
  const isLoading = arState === "loading";
  const hasModel = !!dish.model_url;

  return (
    <div
      ref={cardRef}
      className={cn(
        "glassmorphism rounded-2xl overflow-hidden group cursor-pointer flex flex-col h-full ambient-glow",
        "transition-all duration-300 hover:scale-[1.01] hover:border-gold/40 hover:shadow-2xl hover:shadow-gold/5",
        !dish.is_available && "opacity-50 pointer-events-none",
        arState !== "idle" ? "ambient-glow-active border-gold/50 shadow-2xl scale-[1.01]" : "",
        className
      )}
    >
      {/* 3D / Image Viewport Container */}
      <div className="aspect-[4/3] relative overflow-hidden bg-black/40">
        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(dish.id);
            }}
            className="absolute top-3 left-3 z-45 p-2 rounded-full 
                       bg-black/60 border border-white/10 text-foreground/70 
                       backdrop-blur-md transition-all duration-200 
                       hover:text-red-400 hover:bg-black/80 hover:border-red-400/30
                       active:scale-90"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-transform duration-200 active:scale-125",
                isFavorite ? "fill-red-500 text-red-500 scale-110" : ""
              )}
            />
          </button>
        )}
        {/* Shimmer/Overlay for Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 gap-3">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <span className="text-gold text-xs font-heading tracking-widest uppercase animate-pulse">
              Loading 3D Model...
            </span>
          </div>
        )}

        {/* Error overlay */}
        {arState === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 p-4 gap-2 text-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <span className="text-red-400 text-xs font-semibold">3D Preview Unstable</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                arSingleton.detach();
              }}
              className="text-xs text-foreground/60 hover:text-foreground underline mt-1"
            >
              Back to Image
            </button>
          </div>
        )}

        {/* 3D Interactive Canvas Container */}
        {hasModel && (
          <div
            ref={canvasContainerRef}
            className={cn(
              "absolute inset-0 w-full h-full z-10 transition-opacity duration-300",
              isInteractive ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            style={{ touchAction: isInteractive ? "none" : "auto" }}
          />
        )}

        {/* "✕ Close 3D" Exit Control */}
        {isInteractive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              arSingleton.detach();
            }}
            className="absolute top-3 right-3 z-40 px-3 py-1.5 rounded-full 
                       bg-black/80 border border-gold/30 text-gold text-[10px] 
                       font-heading tracking-widest uppercase backdrop-blur-md
                       transition-all duration-200 hover:bg-gold hover:text-background active:scale-95"
            aria-label="Close 3D interaction mode"
          >
            ✕ Close 3D
          </button>
        )}

        {/* Idle state Tap-to-Interact Mask Overlay */}
        {hasModel && arState === "idle" && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              start3DInteraction();
            }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center 
                       bg-black/30 hover:bg-black/50 transition-all duration-300 group/mask"
          >
            <div className="px-4 py-2 rounded-xl bg-black/80 border border-gold/20 text-gold text-xs
                            font-heading tracking-widest uppercase backdrop-blur-md shadow-lg
                            flex items-center gap-2 transition-all duration-300 group-hover/mask:scale-105 group-hover/mask:border-gold/50">
              <svg className="w-3.5 h-3.5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Tap to Orbit 3D
            </div>
          </div>
        )}

        {/* Poster Image Layer */}
        <div className={cn(
          "absolute inset-0 w-full h-full transition-opacity duration-300",
          isInteractive ? "opacity-0" : "opacity-100",
          hasModel ? "z-[5]" : "z-10"
        )}>
          {/* Gradient overlay for poster image */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
          
          {showImage ? (
            <img
              src={isNearViewport ? dish.image_url : undefined}
              alt={dish.name}
              loading="lazy"
              className="w-full h-full object-cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal/20 to-gold/10 flex items-center justify-center">
              <span className="text-4xl">🍽️</span>
            </div>
          )}
        </div>
      </div>

      {/* Details & Action Section */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-4 bg-[#080808]/90">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-lg text-foreground truncate">{dish.name}</h3>
            <span className="text-gold font-heading text-sm flex-shrink-0">
              {formatPrice(dish.price)}
            </span>
          </div>
          <p className="text-sm text-foreground/60 line-clamp-2 leading-relaxed">{dish.description}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Add to Order Button */}
          <button
            onClick={handleOrderClick}
            disabled={!dish.is_available || isAdded}
            className={cn(
              "flex-1 min-h-[44px] rounded-xl text-xs font-heading tracking-wider uppercase border transition-all duration-300",
              "flex items-center justify-center gap-2 select-none",
              isAdded
                ? "bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse"
                : "bg-gold text-background border-gold font-bold hover:bg-gold/90 hover:shadow-lg hover:shadow-gold/15 active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none"
            )}
          >
            {isAdded ? (
              <>
                <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Added!
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
                Add to Order
              </>
            )}
          </button>

          {/* View in AR Button (only show if model_url is present and device supports AR) */}
          {hasModel && arSupported && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await launchAR(dish.model_url!, dish.ios_src);
                } catch (err) {
                  console.error("Failed to launch AR:", err);
                }
              }}
              className={cn(
                "min-h-[44px] px-3 sm:px-4 rounded-xl bg-teal/20 text-teal-300 text-[10px] sm:text-xs font-heading tracking-wider uppercase border border-teal/20",
                "flex items-center justify-center gap-1.5",
                "transition-all duration-200 active:scale-[0.97]",
                "hover:bg-teal/30 hover:border-teal/40"
              )}
              title="View in your space using Augmented Reality"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              View in Space
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(MenuCard);



"use client";

import { useEffect, useRef, useState } from "react";

interface VirtualizationOpts {
  onViewportEnter?: () => void;
  onViewportExit?: () => void;
  onGcTrigger?: () => void;
}

export function useCardVirtualization({
  onViewportEnter,
  onViewportExit,
  onGcTrigger,
}: VirtualizationOpts = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Observer 1: Hydrate threshold (rootMargin: 100px)
    // Pre-loads / hydrates card content when it approaches the viewport
    const hydrateObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          onViewportEnter?.();
        } else {
          onViewportExit?.();
        }
      },
      { rootMargin: "100px" }
    );

    // Observer 2: GC threshold (rootMargin: -300px)
    // Triggers garbage collection / singleton canvas detach when card goes far offscreen
    const gcObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          onGcTrigger?.();
        }
      },
      { rootMargin: "-300px 0px" }
    );

    hydrateObserver.observe(el);
    gcObserver.observe(el);

    return () => {
      hydrateObserver.disconnect();
      gcObserver.disconnect();
    };
  }, [onViewportEnter, onViewportExit, onGcTrigger]);

  return { ref, isNearViewport };
}

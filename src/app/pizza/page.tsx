"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import ModelViewer, { useModelViewer } from "@/components/ar/ModelViewer";
import { preferPoster } from "@/lib/network";

const PIZZA = {
  name: "Margherita Pizza",
  price: 18.99,
  description: "Classic wood-fired margherita with San Marzano tomatoes, fresh mozzarella, and basil.",
  modelUrl: "/models/pizza.glb",
  posterUrl: "/models/pizza-placeholder.webp",
  iosSrc: "/models/pizza.usdz",
};

function ARModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [slowNetwork, setSlowNetwork] = useState(false);
  const [download3D, setDownload3D] = useState(false);
  const { containerRef, ready, error } = useModelViewer({
    src: PIZZA.modelUrl,
    poster: PIZZA.posterUrl,
    iosSrc: PIZZA.iosSrc,
    alt: PIZZA.name,
  });

  useEffect(() => {
    if (open) {
      setSlowNetwork(preferPoster());
      setDownload3D(false);
    }
  }, [open]);

  const showModel = slowNetwork ? download3D : true;

  return (
    <Modal open={open} onClose={onClose} title={PIZZA.name}>
      <div className="space-y-4">
        {slowNetwork && !download3D ? (
          <div className="space-y-3">
            <div className="w-full min-h-[300px] rounded-xl overflow-hidden">
              <img
                src={PIZZA.posterUrl}
                alt={PIZZA.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-foreground/50 text-center">
                Slow connection detected. 3D model is ~2MB.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDownload3D(true)}
                className="w-full"
              >
                Download 3D (large)
              </Button>
            </div>
          </div>
        ) : showModel ? (
          <div
            ref={containerRef}
            className="relative w-full min-h-[400px] bg-[#050505] rounded-xl overflow-hidden"
          >
            {!ready && !error && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <span className="text-foreground/50 text-sm">Loading 3D model...</span>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <p className="text-foreground/50 text-sm">3D model unavailable</p>
              </div>
            )}
          </div>
        ) : null}

        <a
          href={PIZZA.iosSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          Open in iOS Quick Look
        </a>
      </div>
    </Modal>
  );
}

export default function PizzaPage() {
  const [arOpen, setArOpen] = useState(false);

  return (
    <main className="flex items-start justify-center min-h-screen bg-background p-6 pt-24">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] overflow-hidden shadow-xl">
          <div className="w-full h-56 overflow-hidden">
            <img
              src={PIZZA.posterUrl}
              alt={PIZZA.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-foreground">{PIZZA.name}</h1>
              <Badge variant="gold">${PIZZA.price.toFixed(2)}</Badge>
            </div>
            <p className="text-sm text-foreground/60 leading-relaxed">
              {PIZZA.description}
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => setArOpen(true)}
                className="flex-1"
              >
                View in AR
              </Button>
              <Button variant="ghost" size="md" className="flex-1">
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ARModal open={arOpen} onClose={() => setArOpen(false)} />
    </main>
  );
}

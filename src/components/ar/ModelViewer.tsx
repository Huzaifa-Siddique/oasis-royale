"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ModelViewerProps = {
  src: string;
  alt: string;
  className?: string;
  poster?: string;
};

let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadModelViewerScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) {
    return new Promise((resolve) => loadCallbacks.push(resolve));
  }
  scriptLoading = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
    script.type = "module";
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
      resolve();
    };
    script.onerror = () => {
      scriptLoading = false;
      reject(new Error("Failed to load model-viewer"));
    };
    document.head.appendChild(script);
  });
}

export default function ModelViewer({
  src,
  alt,
  className,
  poster,
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let el: HTMLElement | null = null;

    async function init() {
      try {
        await loadModelViewerScript();
        await customElements.whenDefined("model-viewer");
        setSupported(true);

        const node = document.createElement("model-viewer");
        node.setAttribute("src", src);
        node.setAttribute("alt", alt);
        node.setAttribute("camera-controls", "");
        node.setAttribute("auto-rotate", "");
        node.setAttribute("shadow-intensity", "1");
        node.setAttribute("style", "width:100%;height:100%;");
        if (poster) node.setAttribute("poster", poster);

        node.addEventListener("load", () => setLoading(false));
        node.addEventListener("error", () => {
          setError(true);
          setLoading(false);
        });

        containerRef.current?.appendChild(node);
        el = node;
      } catch {
        setError(true);
        setLoading(false);
      }
    }

    init();

    return () => {
      el?.remove();
    };
  }, [src, alt, poster]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full bg-[#050505] rounded-xl overflow-hidden",
        className
      )}
    >
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
        </div>
      )}
      {error && poster && (
        <div className="w-full h-full min-h-[300px] flex items-center justify-center">
          <img src={poster} alt={alt} className="w-full h-full object-cover rounded-xl" />
        </div>
      )}
      {error && !poster && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-foreground/50 text-sm">3D model unavailable</p>
        </div>
      )}
    </div>
  );
}

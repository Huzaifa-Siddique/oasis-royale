"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type MountOpts = {
  src: string;
  poster?: string;
  iosSrc?: string;
  alt?: string;
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

// Singleton: one model-viewer element shared across all mounts
let singletonEl: HTMLElement | null = null;
let singletonContainer: HTMLElement | null = null;
let singletonOpts: MountOpts | null = null;

function getOrCreateSingleton(): HTMLElement {
  if (!singletonEl) {
    singletonEl = document.createElement("model-viewer");
    singletonEl.setAttribute("camera-controls", "");
    singletonEl.setAttribute("auto-rotate", "");
    singletonEl.setAttribute("shadow-intensity", "1");
    singletonEl.setAttribute("style", "width:100%;height:100%;");
  }
  return singletonEl;
}

export function mountModelViewer(container: HTMLElement, opts: MountOpts) {
  const el = getOrCreateSingleton();

  // Move from previous container if needed (single DOM node)
  if (singletonContainer && singletonContainer !== container) {
    singletonContainer.removeChild(el);
  }

  // Update attributes
  el.setAttribute("src", opts.src);
  el.setAttribute("alt", opts.alt || "3D Model");
  if (opts.poster) el.setAttribute("poster", opts.poster);
  if (opts.iosSrc) el.setAttribute("ios-src", opts.iosSrc);
  el.setAttribute("ar", "");
  el.setAttribute("ar-modes", "webxr scene-viewer quick-look");

  container.appendChild(el);
  singletonContainer = container;
  singletonOpts = opts;
}

export function unmountModelViewer() {
  if (singletonEl && singletonContainer) {
    singletonContainer.removeChild(singletonEl);
    singletonContainer = null;
  }
}

export async function ensureModelViewerReady(): Promise<boolean> {
  try {
    await loadModelViewerScript();
    await customElements.whenDefined("model-viewer");
    return true;
  } catch {
    return false;
  }
}

// React hook for singleton usage
export function useModelViewer(opts: MountOpts) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const ok = await ensureModelViewerReady();
      if (cancelled) return;
      if (!ok) {
        setError(true);
        return;
      }
      setReady(true);
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    mountModelViewer(containerRef.current, opts);

    return () => {
      unmountModelViewer();
    };
  }, [ready, opts.src, opts.poster, opts.iosSrc]);

  return { containerRef, ready, error };
}

// React component wrapper
type ModelViewerProps = {
  src: string;
  alt?: string;
  className?: string;
  poster?: string;
  iosSrc?: string;
};

export default function ModelViewer({
  src,
  alt,
  className,
  poster,
  iosSrc,
}: ModelViewerProps) {
  const { containerRef, ready, error } = useModelViewer({
    src,
    poster,
    iosSrc,
    alt,
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full bg-[#050505] rounded-xl overflow-hidden",
        className
      )}
    >
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 min-h-[300px]">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
        </div>
      )}
      {error && poster && (
        <div className="w-full min-h-[300px] flex items-center justify-center">
          <img src={poster} alt={alt || "3D Model"} className="w-full h-full object-cover rounded-xl" />
        </div>
      )}
      {error && !poster && (
        <div className="absolute inset-0 flex items-center justify-center z-10 min-h-[300px]">
          <p className="text-foreground/50 text-sm">3D model unavailable</p>
        </div>
      )}
    </div>
  );
}

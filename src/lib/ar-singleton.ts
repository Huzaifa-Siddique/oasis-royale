"use client";

export type ARState = "idle" | "loading" | "ready" | "error";

let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadModelViewerScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("model-viewer")) {
    scriptLoaded = true;
    return Promise.resolve();
  }
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) {
    return new Promise((resolve) => loadCallbacks.push(resolve));
  }
  scriptLoading = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer-umd.min.js";
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

function createModelViewer(): HTMLElement {
  const el = document.createElement("model-viewer");
  el.setAttribute("camera-controls", "");
  el.setAttribute("auto-rotate", "");
  el.setAttribute("shadow-intensity", "1.5");
  el.setAttribute("shadow-softness", "1");
  el.setAttribute("exposure", "1.2");
  el.setAttribute("tone-mapping", "neutral");
  el.setAttribute("draco-decoder", "/wasm/draco_decoder.wasm");
  el.setAttribute("camera-orbit", "0deg 75deg 2m");
  el.setAttribute("camera-target", "0 0 0");
  el.setAttribute("max-polar-angle", "85deg"); // Lock looking from bottom
  el.style.width = "100%";
  el.style.height = "100%";
  el.style.display = "block";
  return el;
}

class ARSingletonManager {
  private node: HTMLElement | null = null;
  private currentContainer: HTMLElement | null = null;
  private currentCallback: ((state: ARState, error?: string) => void) | null = null;
  private isLoaded = false;
  private abortController: AbortController | null = null;

  private onLoadBound = this.onLoad.bind(this);
  private onErrorBound = this.onError.bind(this);

  private onLoad() {
    this.isLoaded = true;
    this.notify("ready");
  }

  private onError() {
    this.isLoaded = false;
    this.notify("error", "Failed to load 3D model");
  }

  private notify(state: ARState, error?: string) {
    if (this.currentCallback) {
      this.currentCallback(state, error);
    }
  }

  async attachTo(
    container: HTMLElement,
    opts: {
      src: string;
      poster?: string;
      iosSrc?: string;
      alt?: string;
    },
    onStateChange: (state: ARState, error?: string) => void
  ) {
    // 1. Cancel any pending state transition/load
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.currentCallback = onStateChange;
    this.notify("loading");

    try {
      // 2. Ensure script is loaded and custom element is defined
      await loadModelViewerScript();
      if (signal.aborted) return;
      await customElements.whenDefined("model-viewer");
      if (signal.aborted) return;

      // 3. Lazy initialize the single model-viewer DOM element
      if (!this.node) {
        this.node = createModelViewer();
        this.node.addEventListener("load", this.onLoadBound);
        this.node.addEventListener("error", this.onErrorBound);
      }

      const prevSrc = this.node.getAttribute("src");
      const isSameSrc = prevSrc === opts.src;

      // 4. Update attributes on the single instance
      this.node.setAttribute("src", opts.src);
      this.node.setAttribute("alt", opts.alt || "3D Model");
      if (opts.poster) {
        this.node.setAttribute("poster", opts.poster);
      } else {
        this.node.removeAttribute("poster");
      }
      if (opts.iosSrc) {
        this.node.setAttribute("ios-src", opts.iosSrc);
      } else {
        this.node.removeAttribute("ios-src");
      }

      // 5. Reparent the DOM node to the target card container
      if (this.currentContainer !== container) {
        this.detach(); // Detach from previous container
        this.currentContainer = container;
        container.appendChild(this.node);
      }

      // 6. Notify if already loaded, else wait for load event
      if (isSameSrc && this.isLoaded) {
        this.notify("ready");
      } else {
        this.isLoaded = false;
      }
    } catch (e: any) {
      if (!signal.aborted) {
        this.isLoaded = false;
        this.notify("error", e.message || "Failed to load model-viewer");
      }
    }
  }

  detach() {
    this.notify("idle");
    if (this.node) {
      if (this.node.parentNode) {
        this.node.parentNode.removeChild(this.node);
      }
      // Unload current model from memory by clearing src
      this.node.removeAttribute("src");
      this.node.removeAttribute("poster");
      this.node.removeAttribute("ios-src");
    }
    this.currentContainer = null;
    this.currentCallback = null;
    this.isLoaded = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  dispose() {
    this.detach();
    if (this.node) {
      this.node.removeEventListener("load", this.onLoadBound);
      this.node.removeEventListener("error", this.onErrorBound);
      this.node = null;
    }
  }

  getActiveContainer(): HTMLElement | null {
    return this.currentContainer;
  }
}

export const arSingleton = new ARSingletonManager();

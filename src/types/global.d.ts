import React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        alt?: string;
        loading?: "auto" | "lazy" | "eager";
        "camera-controls"?: boolean | string;
        "auto-rotate"?: boolean | string;
        "rotation-per-second"?: string;
        "shadow-intensity"?: string;
        "shadow-softness"?: string;
        "camera-orbit"?: string;
        "min-camera-orbit"?: string;
        "environment-image"?: string;
        poster?: string;
        "poster-color"?: string;
        reveal?: string;
        ar?: boolean | string;
        "ar-modes"?: string;
        "ios-src"?: string;
      };
    }
  }
}

export {};

"use client";

import React, { useEffect } from "react";

declare module "react" {
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

export function Hero() {
  useEffect(() => {
    import("@google/model-viewer").catch(console.error);
  }, []);

  return (
    <section className="w-full min-h-screen flex flex-col items-center justify-between py-24 bg-black">
      {/* Top */}
      <div className="z-20 text-center">
        <h1 className="text-[14vw] sm:text-6xl md:text-8xl lg:text-[10rem] leading-[1.1] font-heading text-[#D4AF37] drop-shadow-2xl tracking-[0.05em] md:tracking-[0.1em]">
          Oasis Royale
        </h1>
        <p className="mt-6 text-white/90 font-sans font-extralight tracking-[0.5em] text-xs sm:text-sm uppercase max-w-[90vw] leading-relaxed mx-auto">
          A <span className="text-[#D4AF37] font-normal">CINEMATIC</span> <span className="text-[#D4AF37] font-normal">DESERT NOIR</span> EXPERIENCE
        </p>
      </div>

      {/* Middle - 3D Model Only */}
      <div className="relative w-full h-[50vh] flex items-center justify-center z-10">
        <style dangerouslySetInnerHTML={{__html: `
          model-viewer::part(default-poster) {
            background-position: center 46%;
          }
        `}} />
        <model-viewer 
          src="/models/hero-dish.glb" 
          poster="/models/pizza-placeholder.webp"
          reveal="auto"
          camera-controls="true"
          shadow-intensity="1.5"
          camera-orbit="0deg 65deg 100%"
          style={{ width: '100%', height: '100%' }}
        ></model-viewer>
      </div>

      {/* Bottom */}
      <div className="z-20 mt-10">
        <button className="px-10 py-4 border border-[#D4AF37]/50 text-[#D4AF37] font-sans font-light tracking-[0.2em] uppercase text-xs sm:text-sm rounded-full backdrop-blur-md bg-white/5 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] transition-all duration-300">
          Explore Menu
        </button>
      </div>
    </section>
  );
}

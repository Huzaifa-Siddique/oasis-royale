# UI/UX ARCHITECTURAL SPECS - DESERT NOIR DEPLOYMENT (v2.0)

## 1. GLOBAL Z-INDEX STACKING CONTEXT (Strict Hierarchy)
No overlay element can violate this stacking order. Violations cause UI lockouts.

```css
/* Oasis Royale Global Z-Index Registry */
.global-header          { z-index: 100; }  /* Floating global nav - ALWAYS on top */
.category-sticky-bar    { z-index: 90; }   /* Top category switcher - always above cards */
.close-3d-button        { z-index: 40; }   /* "✕ Close 3D" dismiss button inside card */
.tap-to-interact-mask   { z-index: 20; }   /* Idle state transparent overlay */
.model-viewer-3d        { z-index: 10; }   /* WebGL Canvas layer */
.card-image-poster      { z-index: 5; }    /* WebP fallback image */
```

## 2. TOUCH TARGET ISOLATION MATRIX (Anti-Scroll Lock Rule)

### Standard Touch Target Sizing (Industry Compliant)
- **Minimum Touch Target:** 48px × 48px (per WCAG 2.2, Apple HIG, Google Material Design 3)
- **Outer Margin Between Buttons:** 12px to 16px (NOT 150px — 150px breaks all mobile layouts)
- **Bottom Thumb Zone Alignment:** Overlay controls (Order, AR View) pinned to card bottom using glassmorphic bar for natural thumb reach

### Scroll Safety Configuration
```css
/* IDLE STATE — Safe vertical scrolling preserved */
.model-wrapper-mobile {
  position: relative;
  touch-action: pan-y;       /* Browser handles vertical scroll natively */
  pointer-events: none;      /* Passthrough — no 3D touch event interception */
}

/* ACTIVE 3D STATE — Explicit user-triggered only */
.interactive-canvas-active {
  touch-action: none;        /* ONLY when user explicitly taps "Tap to Interact" */
  pointer-events: auto;      /* Enables 3D orbit controls for that card ONLY */
}
```

### The "✕ Close 3D" Exit Control (Mandatory)
When `.interactive-canvas-active` is applied, a visible dismiss button MUST render:
```tsx
<button
  onClick={() => deactivate3DMode()}
  className="absolute top-4 right-4 z-40 px-3 py-2 rounded-full 
             bg-black/60 border border-gold/30 text-gold text-xs 
             font-medium tracking-wide backdrop-blur-md"
  aria-label="Close 3D interaction mode"
>
  ✕ Close 3D
</button>
```
This button guarantees the user can always escape the canvas boundary and resume natural scrolling.

## 3. VIEWPORT & DEVICE COVERAGE MATRIX

| Device | Viewport Width | Card Height (aspect-[3/4]) | Risk | Mitigation |
|:---|:---|:---|:---|:---|
| iPhone SE (1st Gen) | 320px | ~427px | Scroll trap on short screens | ✕ Close 3D always visible |
| iPhone 12 Mini | 360px | ~480px | Overlay blocks category bar | z-index: 90 for sticky bar |
| iPhone 16 Pro Max | 430px | ~573px | Safe | Standard layout applies |
| Samsung Galaxy Z Fold (closed) | 280px | ~373px | Button overflow | Single stacked button column |
| Samsung Galaxy Z Fold (open) | 768px | ~1024px | Stretched grid | Max-width card constraint: 400px |
| Foldable / Tablet | 820px+ | N/A | Multiple columns | Grid max 3 columns, canvas max 400px wide |

## 4. SAFE AREA & NOTCH COMPLIANCE
Sticky category bar must account for device notches and dynamic island:
```css
.category-sticky-bar {
  padding-top: env(safe-area-inset-top, 16px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}
```

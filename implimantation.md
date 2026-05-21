# OASIS ROYALE - IMPLEMENTATION PLAN (v2.0 - Singleton Architecture)
# SYSTEM DEPLOYMENT SEQUENCING

## ARCHITECTURE OVERVIEW
This plan is built around the **Singleton AR Canvas Reparenting Pattern**. One persistent `<model-viewer>` instance lives in global state. Cards "borrow" it temporarily. No multiple WebGL contexts. No memory leaks.

---

## STEP 1: DATA LAYER & API HARDENING
**Owner:** Antigravity (Primary Orchestrator)
**Files:** `src/app/api/dishes/route.ts`, `src/lib/supabase-types.ts`
**Tasks:**
- Validate Supabase `dishes` table includes `model_url` (GLB link), `poster_url` (WebP link), `category` fields
- Add `model_url` and `poster_url` to `Dish` type definition
- Ensure API response is cached at the edge (Next.js `revalidate`)
- Add connection-speed detection utility: `src/lib/network.ts`

```typescript
// src/lib/network.ts
export function isFastConnection(): boolean {
  if (typeof navigator === "undefined") return true;
  const conn = (navigator as any).connection;
  if (!conn) return true;
  if (conn.saveData) return false;
  return !["slow-2g", "2g", "3g"].includes(conn.effectiveType);
}
```

---

## STEP 2: SINGLETON AR CANVAS MANAGER
**Owner:** Antigravity (Primary Orchestrator)
**Files:** `src/lib/ar-singleton.ts`, `src/components/ar/ModelViewer.tsx` (rewrite)
**Tasks:**
- Create a global singleton that holds exactly ONE `<model-viewer>` DOM node
- Implement `attachTo(container)` and `detach()` methods using DOM reparenting
- Add `isCancelled` AbortController pattern to eliminate race conditions
- Add hysteresis-based `IntersectionObserver` hook

```typescript
// src/lib/ar-singleton.ts (concept)
class ARSingletonManager {
  private node: HTMLElement | null = null;
  private currentContainer: HTMLElement | null = null;

  getOrCreate(): HTMLElement { ... }
  attachTo(container: HTMLElement, src: string, poster: string): void { ... }
  detach(): void { ... }
  dispose(): void { ... }
}
export const arSingleton = new ARSingletonManager();
```

---

## STEP 3: MENU CARD 3D UPGRADE
**Owner:** Antigravity (Primary Orchestrator) → delegates style QA to Claude Code
**Files:** `src/components/ui/MenuCard.tsx` (full rewrite)
**Tasks:**
- Replace the 🍽️ emoji placeholder with WebP poster image
- Add 3-state system: `idle` → `loading` → `interactive`
- Idle state: WebP poster + shimmer overlay + "Tap to Interact" button
- Interactive state: Singleton canvas injected + "✕ Close 3D" button visible
- Apply correct z-index hierarchy from `uiuxdesign.md`
- Apply `touch-action: pan-y` on idle, `touch-action: none` on interactive

---

## STEP 4: MENU CLIENT CATEGORY SYSTEM
**Owner:** Antigravity → delegates testing to OpenCode (Qwen3.6)
**Files:** `src/app/menu/MenuClient.tsx` (upgrade)
**Tasks:**
- Add sticky category filter bar (Signature | Pizzas | Burgers | Drinks)
- Implement `React.memo` on `MenuCard` to prevent reconciliation on category switch
- When category switches: detach active singleton canvas first, then swap grid
- Add skeleton shimmer loading states for initial data fetch

---

## STEP 5: INTERSECTION OBSERVER VIRTUALIZATION
**Owner:** Antigravity → code review by Codex (DeepSeek V3)
**Files:** `src/hooks/useCardVirtualization.ts` (new file)
**Tasks:**
- Implement hysteresis observer with dual thresholds:
  - **Hydrate threshold:** Card enters viewport (rootMargin: 100px)
  - **GC threshold:** Card exits viewport fully (rootMargin: -300px, triggers singleton detach)
- Connect hook to MenuCard to auto-manage singleton lifecycle

---

## STEP 6: STYLE & ANIMATION POLISH
**Owner:** Claude Code (Gemini Free API) → QA by Antigravity
**Files:** `src/app/globals.css`, `src/components/ui/MenuCard.tsx`
**Tasks:**
- Implement gold shimmer skeleton loader animation
- Smooth 300ms opacity crossfade: WebP → 3D model
- Glassmorphic bottom bar for "Add to Order" and "View in AR" buttons
- Safe-area insets on sticky category bar
- Mobile-first responsive grid: 1-col mobile, 2-col tablet, 3-col desktop

---

## STEP 7: PERFORMANCE AUDIT & MEMORY PROFILING
**Owner:** Antigravity (lead) + all agents verify
**Tools:** Chrome DevTools Memory Tab, Lighthouse CI
**Targets:**
- JS Heap: < 80MB during active 3D interaction
- GPU VRAM: < 120MB
- LCP: < 1.0s
- No WebGL context leaks on category swaps (verify via Chrome Task Manager)
- Lighthouse Mobile Performance Score: > 90

---

## AGENT ASSIGNMENT SUMMARY

| Agent | Model | Primary Role |
|:---|:---|:---|
| **Antigravity** | Gemini 3.1 Pro | Lead orchestrator, Singleton architecture, code review |
| **Claude Code** | Gemini Free / 2.5 Flash | Style polish, CSS animations, component markup |
| **OpenCode** | Qwen 3.6 Plus | Category system testing, mobile QA |
| **Codex** | DeepSeek V3 (via OpenRouter) | Hook implementations, code review |

> **RULE:** All agents check `docs/context.md` before writing any code. No concurrent writes. Antigravity holds final merge authority.

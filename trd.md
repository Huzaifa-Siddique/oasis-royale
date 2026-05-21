# TECHNICAL REQUIREMENT DOCUMENT (TRD) - THE MATRIX PIPELINE (v2.0)

## 1. PERFORMANCE MEMORY CEILING
* **DOM Node Isolation (The Singleton Canvas Pattern):** 
  Active `<model-viewer>` or WebGL canvas instances cannot exceed a maximum count of **ONE (1)** inside the DOM at any runtime millisecond. 
  * *Mechanism:* Ek static, persistent global `<model-viewer>` instance context me register rahegi. Jab bhi user kisi card par "Tap to Interact" click karega, tab standard DOM `appendChild` ke through us single active canvas element ko target card container ke frame me re-parent kiya jayega.
  * *Result:* CPU execution bottleneck, shader compilation delays, aur multiple WebGL context collisions completely eliminate ho jayenge.
* **Hardware Acceleration Primitives:** Transitions bypass layout reflow engines. Only use CSS GPU transforms:
  ```css
  transform: translate3d(0, 0, 0);
  will-change: transform, opacity;
  ```

## 2. THE MULTI-AGENT STATE REGISTER PROTOCOL
Claude Code, Codex, OpenCode aur Antigravity ke concurrent collisions aur memory loss ko block karne ke liye ek **Shared Register / State Machine** pipeline run hogi:
* **The Lock Rule:** Kisi bhi modification se pehle har agent strict rule ke mutabik `docs/context.md` ko inspect karega to extract the active session's 'NEXT_AGENT' parameter.
* **Handshake Execution:** Processing end hone par agent status tracker update karega, current changes log karega, and next step direction explicit detailed prompt me assign karke control transfer karega.

## 3. ASSET LIFECYCLE & CLEANUP
* Prop changes ya component swaps ke dauran, elements memory leaks prevent karne ke liye:
  * Dynamic script imports safe `AbortController` or cancellation variables bindings hold karenge to discard late mounts if unmounted mid-load.
  * Unmounting time me active WebGL layers se resources call custom `.dispose()` trigger handles execute karke state completely clean karenge.

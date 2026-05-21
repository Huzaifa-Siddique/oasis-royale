# OASIS ROYALE - PRODUCTION APP FLOW (v2.0 - Performance Hardened)

```mermaid
graph TD
    UserScroll[User Scroll Interface] --> GridMount[Dynamic Cards Grid Mounts]
    GridMount --> StateA[State A: Static WebP Preview / Shimmer Shimmer]
    StateA --> UserTap{User Taps 'Tap to Interact'}
    UserTap -- Yes --> StateShift[State Shift: Core Hydration]
    StateShift --> ReparentCanvas[Move Singleton AR Canvas into Tapped Card]
    ReparentCanvas --> SetInteractive[Pointer-events: AUTO, touch-action: none]
    ReparentCanvas --> SmoothFade[Poster fades smoothly - 300ms]
    
    GridMount --> VirtualObserver{IntersectionObserver Threshold}
    VirtualObserver -- Completely Offscreen > 300px -- > AutoGC[Auto-Garbage Collection Protocol]
    AutoGC --> DetachCanvas[Detach Canvas from Card, restore WebP]
    DetachCanvas --> RecycleCanvas[Recycle Canvas to Global Shared State]
```

## 1. MOUNT & IDLE PREVIEW (State A)
* Grid items compile strictly `aspect-[3/4]` aspect-ratio parameters standardise rakhne ke liye.
* Images/posters pointer-events trigger bypass karenge (`pointer-events: none`) vertical browser scroll touch integrity keep karne ke liye.

## 2. INTERACTION HYDRATION (State B)
* User click karte hi event capture hoga, pointer-events changes to `auto`.
* **Singleton Injection:** Single persistent `<model-viewer>` global instance check target index wrapper node target kar dynamic position append access karegi.
* `@google/model-viewer` native async listener fires, load callback par shimmer spinner exit, and 3D item opacity triggers transition.

## 3. VIRTUALIZATION & AUTO-GARBAGE COLLECTION (State C)
* **Hysteresis-Based Recycling:**
  * Component scroll visibility detect karne ke liye IntersectionObserver active trigger setup rahega.
  * Card unmount or off-screen scroll boundary completely exit hote hi (Viewport offset margins range > 300px), system trigger fires, canvas detach logic releases context, aur target back fallback WebP setup print details default position swap kar memory preserve target achieve kar lega.
  * **Result:** CPU core and GPU VRAM thread completely safe from thrashing cycles.

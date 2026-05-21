# PRODUCT REQUIREMENT DOCUMENT (PRD) - OASIS ROYALE MENU SECTION (v2.0 - Performance Hardened)

## 1. EXECUTIVE SUMMARY
Oasis Royale ka Menu Section ek luxury 3D interactive dining experience hoga. Yeh design mobile-first, fluid, aur extremely optimized hai. Hum user ko immersive real-time 3D models showcase karenge, but static fallback and low-memory devices par fluid scrolling preserve karenge.

## 2. USER EXPERIENCE (UX) & CORE FEATURES
* **Dynamic Category Swapping:** User Top Sticky Bar se categories (Signature, Pizzas, Burgers, Drinks) switch karega bina page reload, visual flickering, ya layout shifts ke.
* **The Zero-Pop 3D Transition (Progressive Enhancement):**
  1. Initial state me optimized low-res placeholder image ya luxury golden shimmering skeleton loader dikhega (Loaded < 1.0s).
  2. Model-Viewer container background me lazily hydrate aur parse hoga.
  3. Load completion par static preview smooth opacity transition (300ms) ke sath fade-out hoga, aur active 3D model show hoga.
* **Spatial & Gestural Safety:** Mobile interface standard scrolling rules preserve karega. Canvas ke active hone par scroll trap se bachne ke liye responsive canvas boundaries ke side me explicit gutters and clear **"✕ Close 3D" exit controls** diye jayenge.

## 3. TECHNICAL BUDGETS & FAIL-SAFES
* **Memory Constraints (4GB RAM Guard):**
  * **Tab JS Heap Limit:** Max **80MB** active heap consumption.
  * **GPU VRAM Ceiling:** Max **120MB** GPU VRAM footprint.
  * **Asset Optimization:** GLB assets strict **Draco/KTX2 compressed** format me honge (Max 1.2MB per model).
* **Time to Interact (TTI):** Static page shell loading target **< 1.2s**. Heavy WebGL scripts lazily background me execute honge.
* **Network Fail-Safe:** Agar connection status slow ho (`navigator.connection.effectiveType < 4g` ya Save-Data active ho) ya WebGL supported na ho, toh page 3D rendering ko automatic bypass karke direct premium 2D photography layout print karega.

## 4. ACCESSIBILITY & SEO
* **a11y Compliance:** Semantic hidden text elements (`ul`, `li` tags description aur prices ke sath) standard screen readers ke liye output honge. Sabhi buttons ke descriptive `aria-label` attribute generate honge.
* **SEO Structure:** Single H1 heading per page hierarchically aligned, and custom meta description defined.

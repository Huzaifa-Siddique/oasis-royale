## 1. Advanced Animation Architecture (GSAP + Lenis)
* **Liquid Scrolling:** Use 'Lenis' for smooth scrolling. Every scroll increment must trigger a subtle 'Y-axis' shift in background elements (Parallax factor: 0.1).
* **The "Orchestration" Rule:** Elements must not animate all at once. Use GSAP 'Stagger' (0.1s) so they enter like a wave, not a block.
* **Performance Guard:** Apply `pointer-events: none` to background particles during scroll to save CPU cycles.

## 2. Micro-Interactions (Mobile Specific)
* **Active States:** Replace 'Hover' with 'Active' states. Buttons must use a `spring` transition (stiffness: 400, damping: 25) when tapped.
* **Navigation:** Use a "Sticky Bottom Navigation" bar (Glassmorphic). In restaurants, people use their thumbs at the bottom of the screen, not the top.
* **Image Loading:** Use "Blur-up" technique. Show a low-res blurred gold gradient before the 3D model/Image pops in.

## 3. Dark Mode Refinement
* **Black is not #000:** Use `#050505` for base. Use `#0A0A0A` for cards to create "Depth Layers."
* **Teal Accents:** Use Teal (`#114B5F`) with `opacity: 0.2` for background glows to mimic "Ambient Lighting."



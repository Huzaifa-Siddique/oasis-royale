# AR Engineering & Performance Specification (Production Grade)

## 1. Asset Pipeline & Optimization
* **Texture Compression:** ALL textures must be KTX2 (Basis Universal). PNG/JPG/WebP are forbidden for 3D models.
* **Geometry:** 25k - 30k Triangles max. Use 'Draco' Mesh Compression (Must include Draco decoder in the frontend).
* **Draw Calls:** Merge all materials into a single 'Atlas'. 1 Dish = 1 Draw Call. Multiple materials will kill the frame rate.

## 2. Memory & Lifecycle Management
* **Virtualization:** Only the 3 closest models to the viewport are allowed to be "Active." 
* **Auto-Dispose:** When a `model-viewer` component unmounts, the agent must call `model.dismiss()` to flush the GPU buffer.
* **Loading Strategy:** Use 'Poster' images (High-quality WebP renders). The actual 3D model only downloads when the user interacts with the 'View in 3D' button.

## 3. Lighting & Realism (The "Premium" Factor)
* **Shadows:** Use `shadow-intensity="1.5"` and `shadow-softness="1"`. Use a contact shadow plane to prevent the food from "floating."
* **Exposure:** Lock `camera-orbit` and `min-camera-orbit` to prevent users from seeing the "unmodeled" bottom of the food plate.
* **Lighting:** Use a single 256px LDR (Low Dynamic Range) environment map for reflections to save 90% bandwidth vs HDR.

## 4. Stability & Fallbacks
* **AR-Status Check:** Check `HTMLModelViewerElement.canActivateAR` before showing the AR button.
* **Fallback:** If WebXR fails, initiate "Object Mode" (3D rotation inside the browser UI) instead of attempting to open the camera.


USDZ asset instructions
=======================

This project references an iOS Quick Look asset at `/models/pizza.usdz` for AR Quick Look on iOS devices.

How to add a `.usdz` file:

- Preferred: Create/obtain a `.usdz` export from your 3D artist or use Apple's Reality Converter (macOS).
- Alternative: Use `usdzconvert` or online converters to convert glTF/GLB to USDZ. Example (macOS with `usdzconvert`):

```bash
# Convert GLB to USDZ (example tool may vary)
usdzconvert public/models/pizza.glb public/models/pizza.usdz
```

- Place the final `pizza.usdz` file in `public/models/` and commit it. Netlify will serve it as a static asset.

Notes:
- USDZ files can be large. If you do not want to commit a large binary, host the `.usdz` on a CDN and set `ios_src` to the CDN URL in the API.
- After adding the file, ensure `GET /api/dishes` returns `ios_src` and the UI shows the Quick Look link.

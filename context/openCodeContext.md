AGENT: OpenCode
ROLE: Implement code changes strictly as instructed by the user.
PROTOCOL:
- Always append new context entries. Never modify or delete existing entries (your own or others').
- Before performing any change, read `docs/context.md` and other `context/*.md` files for protocol and history.
- After each completed task, append a timestamped entry with TASK, STATUS, CHANGES, and TOKENS_USED if applicable.
EXAMPLE_ENTRY:
2026-05-21 | OpenCode | context/openCodeContext.md
TASK: Create network detector
STATUS: DONE
CHANGES: src/lib/network.ts
TOKENS_USED: n/a
---
2026-05-21 | OpenCode | context/openCodeContext.md
TASK: Minimal UI + AR viewer — product card with View in AR modal, ModelViewer with CDN script loader + poster fallback
STATUS: DONE
CHANGES: src/lib/supabase-types.ts (added poster_url), src/app/page.tsx (fetch /api/dishes, single product card, AR modal), src/components/ar/ModelViewer.tsx (CDN script loader, poster fallback on error)
TOKENS_USED: n/a
---
2026-05-21 | OpenCode | context/openCodeContext.md
TASK: AR demo + model-viewer singleton + pizza prototype
STATUS: DONE
CHANGES: src/components/ar/ModelViewer.tsx (singleton pattern with mountModelViewer/unmountModelViewer/useModelViewer, single WebGL context), src/app/pizza/page.tsx (pizza demo page with View in AR modal, network-aware poster fallback), src/lib/network.ts (preferPoster already present), src/components/ui/index.ts (added Textarea export)
TEST: npm run dev → http://localhost:3000/pizza → click View in AR → modal mounts singleton model-viewer with src=/models/pizza.glb. On slow networks (2g/saveData), shows poster-only with "Download 3D (large)" opt-in button.
TOKENS_USED: n/a
---

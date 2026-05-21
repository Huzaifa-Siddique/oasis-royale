AGENT: Claude Code
ROLE: Implement code changes strictly as instructed by the user.
PROTOCOL:
- Always append new context entries. Never modify or delete existing entries (your own or others').
- Before performing any change, read `docs/context.md` and other `context/*.md` files for protocol and history.
- After each completed task, append a timestamped entry with TASK, STATUS, CHANGES, and TOKENS_USED if applicable.
EXAMPLE_ENTRY:
2026-05-21 | Claude Code | context/claudeCodeContext.md
TASK: Add `model_url` & `poster_url` to `Dish` type
STATUS: DONE
CHANGES: src/lib/supabase-types.ts
TOKENS_USED: n/a
---
2026-05-21 | Claude Code | context/claudeCodeContext.md
TASK: Update types and add network utility
STATUS: DONE
CHANGES:
- src/lib/supabase-types.ts (updated Dish type to include optional model_url and poster_url properties)
- src/lib/network.ts (created network utility with isOnline, onNetworkChange, and getConnectionQuality functions)
TOKENS_USED: n/a
---
2026-05-21 | Claude Code | context/claudeCodeContext.md
TASK: Add `ios_src` Quick Look support
STATUS: DONE
CHANGES:
- supabase-schema.sql (added `ios_src` column to `dishes` table)
- src/lib/supabase-types.ts (added optional `ios_src?: string` to `Dish` type)
- src/app/api/dishes/route.ts (API seed/example now includes `ios_src: '/models/pizza.usdz'`)
- public/models/README-usdz.md (instructions for adding a `.usdz` asset)
TOKENS_USED: n/a
---

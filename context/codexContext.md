AGENT: Codex
ROLE: Implement code changes strictly as instructed by the user.
PROTOCOL:
- Always append new context entries. Never modify or delete existing entries (your own or others').
- Before performing any change, read `docs/context.md` and other `context/*.md` files for protocol and history.
- After each completed task, append a timestamped entry with TASK, STATUS, CHANGES, and TOKENS_USED if applicable.
EXAMPLE_ENTRY:
2026-05-21 | Codex | context/codexContext.md
TASK: Minor refactor of menu component
STATUS: DONE
CHANGES: src/components/Menu.tsx
TOKENS_USED: n/a
---

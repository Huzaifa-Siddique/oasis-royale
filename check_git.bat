@echo off
cd /d "d:\HUZAIFA\Oasis Royale.worktrees\agents-netlify-supabase-env-fix"
echo === Recent Commits ===
git log --oneline -20
echo.
echo === Git Status ===
git status --short
echo.
echo === Diff ===
git diff --cached --stat
git diff --cached

# Main Merge Conflict Checklist

Date: 2026-06-26
Branch: `feature/curriculum-visuals`
Target: `origin/main`

## High-risk overlap

- `backend/src/services/learning_core.py`
  Preserve curriculum routing and visual validation from this branch, then reapply newer logging and orchestration changes from `origin/main`.
- `frontend/src/components/AIExplanationChat.tsx`
  Keep the chat-to-visual mapping for `visual_card.visual_data`, especially `primary_count`, `secondary_count`, `total_count`, and `config`.
- `frontend/package-lock.json`
  Regenerate only after functional conflicts are resolved so lockfile churn does not hide real application differences.

## Additional changed-in-both files to review manually

- `backend/src/agents/prompts.py`
- `backend/src/api/__init__.py`
- `backend/src/api/chat_stream.py`
- `backend/src/core/database.py`
- `backend/src/main.py`

## Merge checklist

- Re-run `git merge-tree $(git merge-base HEAD origin/main) HEAD origin/main` before the actual merge.
- Resolve source files before touching `frontend/package-lock.json`.
- Keep curriculum adapter and frontend visual registry behavior from this branch unless `origin/main` has a strictly newer equivalent.
- Re-test the Grade 1 comparison regression (`34` vs `7`) after conflict resolution.
- Re-run targeted backend and frontend visual tests after the merge result is staged.

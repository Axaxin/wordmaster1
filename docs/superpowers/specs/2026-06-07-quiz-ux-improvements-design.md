# Quiz UX Improvements Design

## Goal

Five targeted UX improvements to the quiz flow and stats page based on user feedback.

## Changes

### 1. Feedback duration 3s

`QuizPlayPage.tsx` `QuizArea` component: change `setTimeout` delay from `1500` to `3000`.

### 2. Auto-play pronunciation on new word

Add `useEffect` in `QuizArea` watching `quiz.current?.word`. When it changes (including on first mount), call `speechSynthesis.cancel()` then `speechSynthesis.speak()` with `lang='en-US'`. This mirrors the existing speak logic in `WordCard`.

### 3. Pause / Resume / Restart controls

Add `paused: boolean` state to `QuizArea`.

**Pause button:** Small button in the top-right of the quiz area, always visible during active quiz. On click: `setPaused(true)`.

**Paused overlay:** When `paused === true`, hide the answer form and show a centered overlay with two buttons:
- 「继续」→ `setPaused(false)`
- 「重来」→ `navigate('/quiz/${unit}/play', { replace: true })`

Restart via `replace: true` navigation causes the entire component tree to unmount and remount — `useQuiz` reinitializes with a freshly shuffled queue, and `QuizPlayPage`'s `useEffect` re-runs to create a new `session_start` event and new `session_id`. No extra state needed.

The pause state does not affect session duration timing. `startTime` was set when the session started; total time including pause is recorded. This is acceptable for a practice tool.

### 4. Fix input focus after feedback

**Current bug:** `inputRef.current?.focus()` runs inside a `setTimeout` callback while the input is still `disabled` (React hasn't re-rendered yet), so focus silently fails.

**Fix:** Remove the `focus()` call from inside `setTimeout`. Add a `useEffect` that fires when `feedback` changes to `null` — at that point React has re-rendered with `disabled={false}`, and `focus()` succeeds:

```tsx
useEffect(() => {
  if (feedback === null) inputRef.current?.focus()
}, [feedback])
```

Keep the existing `inputRef.current?.focus()` call in the correct-answer branch of `handleSubmit` — for correct answers `feedback` stays `null` so the `useEffect` never fires. The `useEffect` only handles the wrong-answer recovery path (feedback transitions from a word string back to `null`).

### 5. Clear stats

**Backend:** New function file `functions/api/student/[username]/clear-stats.ts` handling `DELETE` requests. Executes:
```sql
DELETE FROM quiz_events WHERE student = ?
```
Returns `{ ok: true }`.

**Frontend — api.ts:** Add `clearStats(username: string)` method sending `DELETE` to `/api/student/${encodeURIComponent(username)}/clear-stats`.

**Frontend — StatsPage.tsx:** Add a「清空记录」button below the heading. On click: `window.confirm('确认清空所有记录？此操作不可恢复。')`. If confirmed: call `api.clearStats(username)`, then `setStats(null)` and `setLoading(false)` to reset display (or re-fetch). Style: small red outline button (`border-red-300 text-red-600 hover:bg-red-50`).

## Files Changed

| Action | File |
|---|---|
| Modify | `src/pages/QuizPlayPage.tsx` |
| Modify | `src/lib/api.ts` |
| Modify | `src/pages/StatsPage.tsx` |
| Create | `functions/api/student/[username]/clear-stats.ts` |

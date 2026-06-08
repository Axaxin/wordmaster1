# Quiz Mode Refactor Design

## Goal

Restructure the quiz flow so the user selects a mode first, then a word list. Add an error-words review mode that pulls from the student's existing error statistics.

## Changes Summary

- `/home` becomes a mode selector (replaces word-list-first flow)
- New `WordListPage` at `/quiz/words` holds the current word list UI
- New `ErrorPreviewPage` at `/quiz/errors` shows error word summary before starting
- `QuizPlayPage` gains an "errors" mode fed by router state
- `QuizConfigPage` is deleted (was a pass-through with no real choice)

## Routes

| Route | Component | Notes |
|---|---|---|
| `/home` | `QuizModePage` | Two mode cards |
| `/quiz/words` | `WordListPage` | Word list picker, back → `/home` |
| `/quiz/words/:unit/play` | `QuizPlayPage` | Normal unit quiz (route renamed) |
| `/quiz/errors` | `ErrorPreviewPage` | Error word preview + start |
| `/quiz/errors/play` | `QuizPlayPage` | Error words quiz (words via router state) |
| `/result` | `ResultPage` | Unchanged |
| `/stats` | `StatsPage` | Unchanged |

Deleted routes: `/quiz/:unit` and `/quiz/:unit/play`.

## Files

| Action | File |
|---|---|
| Modify | `src/App.tsx` |
| Modify | `src/pages/HomePage.tsx` → `QuizModePage` |
| Delete | `src/pages/QuizConfigPage.tsx` |
| Create | `src/pages/WordListPage.tsx` |
| Create | `src/pages/ErrorPreviewPage.tsx` |
| Modify | `src/pages/QuizPlayPage.tsx` |
| Modify | `src/types.ts` |

## Page Designs

### QuizModePage (`/home`)

Top bar: username + 「我的统计」link + 退出 button (same as current HomePage).

Body: two mode cards stacked vertically.
- 「词库练习」— 从词库中选词进行测验 → navigates to `/quiz/words`
- 「错词复习」— 重新测试统计中的高频错词 → navigates to `/quiz/errors`

### WordListPage (`/quiz/words`)

Back link → `/home`. Word list cards identical to current HomePage. Clicking a card navigates directly to `/quiz/words/:unit/play` (QuizConfigPage is removed, no intermediate step).

### ErrorPreviewPage (`/quiz/errors`)

On mount: calls `api.getStats(username)`.

**Empty state** (`high_error_words.length === 0`):
- Message: 「暂无错词记录，完成几次测验后这里会显示需要加强的词」
- 「← 返回」button only

**Has errors:**
- Title: 「错词复习」
- List: each unique unit with its error word count (e.g. 「Year 7 Sem 2 Unit 2　3 词」)
- Footer: 「共 N 个错词」
- 「开始复习」button

On 「开始复习」:
1. Collect unique units from `high_error_words`
2. Fetch each unit's word list JSON in parallel (`Promise.all`)
3. For each entry in `high_error_words`, find matching `WordEntry` from the loaded lists and attach `unit` field
4. Navigate to `/quiz/errors/play` with `{ state: { words } }`

### QuizPlayPage (errors mode)

Route `/quiz/errors/play` reads `location.state.words: WordEntry[]` instead of fetching a word list.

- `startSession` and `completeSession` use `unit: "errors"`
- `recordWord` uses `word.unit ?? "errors"` per word, so each word's error stats update under its original unit

Normal mode route `/quiz/words/:unit/play` is unchanged in behavior.

## Type Change

```ts
export interface WordEntry {
  word: string
  meaning: string
  note: string
  unit?: string   // populated only in errors mode
}
```

## Error Handling

- If `getStats` fails on `ErrorPreviewPage`: show error message + retry or back button
- If any word list fetch fails during 「开始复习」: show error message, do not navigate
- If `location.state` is missing on `/quiz/errors/play` (e.g. direct URL visit): redirect to `/quiz/errors`

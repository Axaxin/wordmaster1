# Comparative Quiz Mode Design

## Goal

Split the 101-word foundation-comparison word list into three manageable groups, add explicit comparative/superlative fields to the data, and introduce a new "比较变化练习" quiz mode where students are tested on base form, comparative, and superlative in a single quiz session.

## Word List Split

Replace `year7sem2foundation-comparison.json` with three themed files. Remove the original from `index.json`.

| File | Title | Theme | Words |
|---|---|---|---|
| `year7sem2fc-part1.json` | Year 7 Sem 2 FC Part 1 | 形体描述 | 34 |
| `year7sem2fc-part2.json` | Year 7 Sem 2 FC Part 2 | 品质评价 | 34 |
| `year7sem2fc-part3.json` | Year 7 Sem 2 FC Part 3 | 状态与动作 | 33 |

**Part 1 — 形体描述 (34):** big, small, large, tiny, huge, long, short, tall, high, low, deep, shallow, wide, narrow, thick, thin, heavy, light, fast, slow, quick, quickly, slowly, early, late, new, old, young, hot, cold, warm, cool, dry, wet

**Part 2 — 品质评价 (34):** clean, dirty, dark, bright, loud, quiet, noisy, soft, hard, easy, difficult, simple, clear, important, different, same, right, wrong, true, false, nice, good, bad, well, badly, beautiful, ugly, friendly, happy, sad, angry, busy, free, full

**Part 3 — 状态与动作 (33):** empty, rich, poor, safe, dangerous, calm, kind, strict, careful, careless, carefully, carelessly, usually, often, seldom, always, never, fresh, stale, cloudy, sunny, arrive, leave, start, finish, open, close, remember, forget, bring, take, buy, sell

Each file has `meta` (title, description, total) and `words` array. Each word entry gets optional `comparative` and `superlative` fields where applicable. For "more/most" type words, the full phrase is stored: `"comparative": "more difficult"`, `"superlative": "most difficult"`. Words without comparatives (verbs, some adverbs) omit these fields.

`index.json` entries for the three parts include `"hasComparatives": true`.

## Type Changes

```ts
// src/types.ts
export interface WordEntry {
  word: string
  meaning: string
  note: string
  unit?: string         // populated in errors mode
  comparative?: string  // e.g. "bigger", "more difficult"
  superlative?: string  // e.g. "biggest", "most difficult"
}

export interface WordListIndex {
  file: string
  title: string
  description: string
  total: number
  hasComparatives?: boolean  // true = eligible for 比较变化练习 mode
}
```

## Routes

| Route | Component | Notes |
|---|---|---|
| `/home` | `HomePage` | Add third mode card |
| `/quiz/forms` | `FormListPage` (new) | Shows only lists where `hasComparatives: true` |
| `/quiz/forms/play` | `QuizPlayPage` (existing) | Words via `location.state`, unit via `location.state.unit` |

## Card Expansion Logic

`FormListPage` fetches the selected word list and expands each entry into up to three `WordEntry` objects, then navigates to `/quiz/forms/play` with `{ words: expandedWords, unit: 'forms' }`.

For a word with all three forms:
```
{ word: "big",     meaning: "大的",       note: "adj. 反义：small" }
{ word: "bigger",  meaning: "big 大的",   note: "比较级" }
{ word: "biggest", meaning: "big 大的",   note: "最高级" }
```

For a word without comparatives (e.g. a verb):
```
{ word: "arrive",  meaning: "到达",       note: "v. 近义：get to" }
```

The `note` field carries "比较级" / "最高级" as the prompt label. `WordCard` needs no changes — it already renders `note` where phonetics/POS usually appear.

`useQuiz` receives the full expanded flat list and shuffles/cycles it normally.

## QuizPlayPage Changes

Two minimal changes:

1. Use `location.state?.unit ?? 'errors'` instead of hardcoded `'errors'` when calling `startSession` and `completeSession` in the state-words branch.
2. When no `stateWords` and no `unitParam`, redirect to `/quiz/forms` if the current pathname includes `/forms/`, otherwise redirect to `/quiz/errors`.

## HomePage Changes

Add a third mode card below the existing two:

```
比较变化练习
测试形容词、副词的比较级与最高级变化
→ /quiz/forms
```

## StatsPage Changes

Extend the unit display logic:
- `unit === 'errors'` → "错词复习"
- `unit === 'forms'` → "比较变化练习"
- otherwise → raw unit string

## Error Handling

- `FormListPage` fetch failure: show error message with retry button (same pattern as `ErrorPreviewPage`).
- Direct access to `/quiz/forms/play` without state: redirect to `/quiz/forms`.
- `startSession` failure in forms mode: navigate to `/home` (same as errors mode).

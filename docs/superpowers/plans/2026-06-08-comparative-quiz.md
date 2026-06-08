# Comparative Quiz Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the 101-word foundation-comparison word list into three ~34-word themed groups, enrich each entry with explicit `comparative`/`superlative` fields, and add a "比较变化练习" quiz mode where each word generates up to three quiz cards (base → comparative → superlative).

**Architecture:** A new `expandFormsWords` utility expands a `WordEntry[]` into a flat list of up to 3 entries per word; `FormListPage` fetches a word list, expands it, and hands the flat list to the existing `QuizPlayPage` via `location.state` (same pattern as errors mode). `QuizPlayPage` gains one-line support for a `location.state.unit` override so sessions are recorded as `"forms"` not `"errors"`. The rest of the quiz engine is unchanged.

**Tech Stack:** React 19, TypeScript, React Router v6, Vitest, Tailwind CSS v4, Vite

---

## Codebase orientation

Key files for this feature:

| File | Role |
|---|---|
| `public/wordlists/index.json` | Word list manifest; entries gain `hasComparatives?: boolean` |
| `public/wordlists/year7sem2foundation-comparison.json` | Source data (101 words) — will be replaced by 3 split files |
| `src/types.ts` | `WordEntry` (add `comparative?`, `superlative?`), `WordListIndex` (add `hasComparatives?`) |
| `src/lib/api.ts` | `getWordListIndex()`, `getWordList(file)` — no changes needed |
| `src/hooks/useQuiz.ts` | Quiz state machine — no changes needed |
| `src/components/WordCard.tsx` | Shows `word.meaning` (large) + `word.note` (small) — no changes needed; "比较级" in `note` is the prompt label |
| `src/pages/QuizPlayPage.tsx` | Accepts `location.state.words` + `location.state.unit`; needs 3 small edits |
| `src/pages/HomePage.tsx` | Mode selector — add third card |
| `src/App.tsx` | Route table — add `/quiz/forms` and `/quiz/forms/play` |
| `src/pages/StatsPage.tsx` | Unit display — add `"forms"` → "比较变化练习" |
| `wordlist-raw/split-foundation-comparison.mjs` | New: one-off script that generates the 3 split JSON files |
| `src/lib/expandFormsWords.ts` | New: pure function that expands `WordEntry[]` into up to 3 cards per word |
| `src/lib/expandFormsWords.test.ts` | New: unit tests for expand function |
| `src/pages/FormListPage.tsx` | New: word list picker for 比较变化练习 mode |

---

## Task 1: Generate split word list JSON files

**Files:**
- Create: `wordlist-raw/split-foundation-comparison.mjs`
- Create: `public/wordlists/year7sem2fc-part1.json`
- Create: `public/wordlists/year7sem2fc-part2.json`
- Create: `public/wordlists/year7sem2fc-part3.json`
- Delete: `public/wordlists/year7sem2foundation-comparison.json`
- Modify: `public/wordlists/index.json`

**Split boundaries (0-indexed from original 101-word list):**
- Part 1 (indices 0–33, 34 words): big → cool — 形体描述
- Part 2 (indices 34–67, 34 words): dry → strict — 品质评价
- Part 3 (indices 68–100, 33 words): happy → sell — 状态与动作

**"more/most" overrides** — the original `note` field only stores "more"/"most" without the base word. Four words need manual overrides:

| word | comparative | superlative |
|---|---|---|
| difficult | more difficult | most difficult |
| important | more important | most important |
| beautiful | more beautiful | most beautiful |
| dangerous | more dangerous | most dangerous |

- [ ] **Step 1: Write the generation script**

Create `wordlist-raw/split-foundation-comparison.mjs`:

```js
import { readFileSync, writeFileSync } from 'fs'

const src = JSON.parse(readFileSync('public/wordlists/year7sem2foundation-comparison.json', 'utf8'))
const words = src.words

const moreOverrides = {
  difficult:  { comparative: 'more difficult',  superlative: 'most difficult' },
  important:  { comparative: 'more important',  superlative: 'most important' },
  beautiful:  { comparative: 'more beautiful',  superlative: 'most beautiful' },
  dangerous:  { comparative: 'more dangerous',  superlative: 'most dangerous' },
}

function parseField(note, label) {
  const m = note.match(new RegExp(label + '\\s+([^；\\s]+)'))
  return m ? m[1].replace(/；.*/, '') : null
}

function annotate(w) {
  if (moreOverrides[w.word]) return { ...w, ...moreOverrides[w.word] }
  const comparative = parseField(w.note, '比较级')
  const superlative = parseField(w.note, '最高级')
  const entry = { ...w }
  if (comparative) entry.comparative = comparative
  if (superlative) entry.superlative = superlative
  return entry
}

const annotated = words.map(annotate)

const parts = [
  {
    file: 'year7sem2fc-part1.json',
    title: 'Year 7 Sem 2 FC 第一组',
    description: '形体描述 — 大小/尺寸/重量/速度/温度',
    slice: annotated.slice(0, 34),
  },
  {
    file: 'year7sem2fc-part2.json',
    title: 'Year 7 Sem 2 FC 第二组',
    description: '品质评价 — 整洁/难度/好坏/美丑/情绪',
    slice: annotated.slice(34, 68),
  },
  {
    file: 'year7sem2fc-part3.json',
    title: 'Year 7 Sem 2 FC 第三组',
    description: '状态与动作 — 情绪/状态/频率/天气/动词',
    slice: annotated.slice(68),
  },
]

for (const part of parts) {
  const output = {
    meta: { title: part.title, description: part.description, total: part.slice.length },
    words: part.slice,
  }
  writeFileSync(`public/wordlists/${part.file}`, JSON.stringify(output, null, 2) + '\n')
  console.log(`✓ ${part.slice.length} words → public/wordlists/${part.file}`)
}
```

- [ ] **Step 2: Run the script**

```bash
node wordlist-raw/split-foundation-comparison.mjs
```

Expected output:
```
✓ 34 words → public/wordlists/year7sem2fc-part1.json
✓ 34 words → public/wordlists/year7sem2fc-part2.json
✓ 33 words → public/wordlists/year7sem2fc-part3.json
```

- [ ] **Step 3: Spot-check the output**

```bash
node -e "
const p1 = JSON.parse(require('fs').readFileSync('public/wordlists/year7sem2fc-part1.json'));
const p2 = JSON.parse(require('fs').readFileSync('public/wordlists/year7sem2fc-part2.json'));
const p3 = JSON.parse(require('fs').readFileSync('public/wordlists/year7sem2fc-part3.json'));
console.log('p1 total:', p1.meta.total, 'first:', p1.words[0].word, 'last:', p1.words.at(-1).word);
console.log('p2 total:', p2.meta.total, 'first:', p2.words[0].word, 'last:', p2.words.at(-1).word);
console.log('p3 total:', p3.meta.total, 'first:', p3.words[0].word, 'last:', p3.words.at(-1).word);
const big = p1.words.find(w => w.word === 'big');
const diff = p2.words.find(w => w.word === 'difficult');
const arr = p3.words.find(w => w.word === 'arrive');
console.log('big:', big.comparative, big.superlative);
console.log('difficult:', diff.comparative, diff.superlative);
console.log('arrive comp:', arr.comparative);
"
```

Expected:
```
p1 total: 34 first: big last: cool
p2 total: 34 first: dry last: strict
p3 total: 33 first: happy last: sell
big: bigger biggest
difficult: more difficult most difficult
arrive comp: undefined
```

- [ ] **Step 4: Stage deletion of the original file**

```bash
git rm public/wordlists/year7sem2foundation-comparison.json
```

- [ ] **Step 5: Update `public/wordlists/index.json`**

Replace the existing `year7sem2foundation-comparison.json` entry with three new entries. The full updated `index.json`:

```json
[
  {
    "file": "unit1.json",
    "title": "Unit 1",
    "description": "示例词库 — 常用基础词汇",
    "total": 5
  },
  {
    "file": "year7sem2unit1.json",
    "title": "Year 7 Sem 2 Unit 1",
    "description": "七年级第二学期 Unit 1",
    "total": 76
  },
  {
    "file": "year7sem2unit2.json",
    "title": "Year 7 Sem 2 Unit 2",
    "description": "七年级第二学期 Unit 2",
    "total": 50
  },
  {
    "file": "year7sem2unit3.json",
    "title": "Year 7 Sem 2 Unit 3",
    "description": "七年级第二学期 Unit 3",
    "total": 135
  },
  {
    "file": "year7sem2unit4.json",
    "title": "Year 7 Sem 2 Unit 4",
    "description": "七年级第二学期 Unit 4",
    "total": 59
  },
  {
    "file": "year7sem2unit5.json",
    "title": "Year 7 Sem 2 Unit 5",
    "description": "七年级第二学期 Unit 5",
    "total": 41
  },
  {
    "file": "year7sem2unit6.json",
    "title": "Year 7 Sem 2 Unit 6",
    "description": "七年级第二学期 Unit 6",
    "total": 55
  },
  {
    "file": "year7sem2fc-part1.json",
    "title": "Year 7 Sem 2 FC 第一组",
    "description": "形体描述 — 大小/尺寸/重量/速度/温度",
    "total": 34,
    "hasComparatives": true
  },
  {
    "file": "year7sem2fc-part2.json",
    "title": "Year 7 Sem 2 FC 第二组",
    "description": "品质评价 — 整洁/难度/好坏/美丑/情绪",
    "total": 34,
    "hasComparatives": true
  },
  {
    "file": "year7sem2fc-part3.json",
    "title": "Year 7 Sem 2 FC 第三组",
    "description": "状态与动作 — 情绪/状态/频率/天气/动词",
    "total": 33,
    "hasComparatives": true
  }
]
```

- [ ] **Step 6: Commit**

```bash
git add public/wordlists/year7sem2fc-part1.json public/wordlists/year7sem2fc-part2.json public/wordlists/year7sem2fc-part3.json public/wordlists/index.json wordlist-raw/split-foundation-comparison.mjs
git commit -m "feat: split foundation-comparison into 3 themed groups with comparative fields"
```

---

## Task 2: Update types and add expandFormsWords utility

**Files:**
- Modify: `src/types.ts`
- Create: `src/lib/expandFormsWords.ts`
- Create: `src/lib/expandFormsWords.test.ts`

### Context: existing `WordEntry` (src/types.ts lines 1–8)

```ts
export interface WordEntry {
  word: string
  meaning: string
  note: string
  unit?: string
  image?: string
  example?: string
}
```

### Context: existing `WordListIndex` (src/types.ts lines 21–26)

```ts
export interface WordListIndex {
  file: string
  title: string
  description: string
  total: number
}
```

- [ ] **Step 1: Write the failing tests**

Create `src/lib/expandFormsWords.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { expandFormsWords } from './expandFormsWords'
import type { WordEntry } from '../types'

describe('expandFormsWords', () => {
  it('produces only a base entry for a word without comparatives', () => {
    const words: WordEntry[] = [
      { word: 'arrive', meaning: '到达', note: 'v. 近义：get to' },
    ]
    const result = expandFormsWords(words)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ word: 'arrive', meaning: '到达', note: 'v. 近义：get to' })
  })

  it('produces three entries for a word with both comparative and superlative', () => {
    const words: WordEntry[] = [
      { word: 'big', meaning: '大的', note: 'adj.', comparative: 'bigger', superlative: 'biggest' },
    ]
    const result = expandFormsWords(words)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ word: 'big', meaning: '大的', note: 'adj.' })
    expect(result[1]).toEqual({ word: 'bigger', meaning: 'big 大的', note: '比较级' })
    expect(result[2]).toEqual({ word: 'biggest', meaning: 'big 大的', note: '最高级' })
  })

  it('handles more/most multi-word forms correctly', () => {
    const words: WordEntry[] = [
      { word: 'difficult', meaning: '困难的', note: 'adj.', comparative: 'more difficult', superlative: 'most difficult' },
    ]
    const result = expandFormsWords(words)
    expect(result[1].word).toBe('more difficult')
    expect(result[2].word).toBe('most difficult')
    expect(result[1].meaning).toBe('difficult 困难的')
  })

  it('expands a mixed list correctly', () => {
    const words: WordEntry[] = [
      { word: 'big', meaning: '大的', note: 'adj.', comparative: 'bigger', superlative: 'biggest' },
      { word: 'arrive', meaning: '到达', note: 'v.' },
    ]
    const result = expandFormsWords(words)
    expect(result).toHaveLength(4)
    expect(result[3]).toEqual({ word: 'arrive', meaning: '到达', note: 'v.' })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test:run
```

Expected: FAIL with "Cannot find module './expandFormsWords'"

- [ ] **Step 3: Update `src/types.ts`**

Add `comparative?` and `superlative?` to `WordEntry`, and `hasComparatives?` to `WordListIndex`:

```ts
export interface WordEntry {
  word: string
  meaning: string
  note: string
  unit?: string
  image?: string
  example?: string
  comparative?: string
  superlative?: string
}

export interface WordListMeta {
  title: string
  description: string
  total: number
}

export interface WordList {
  meta: WordListMeta
  words: WordEntry[]
}

export interface WordListIndex {
  file: string
  title: string
  description: string
  total: number
  hasComparatives?: boolean
}
```

(Keep all other interfaces — `Student`, `SessionStartResponse`, `SessionSummary`, `WordErrorStat`, `StudentStats` — exactly as they are.)

- [ ] **Step 4: Create `src/lib/expandFormsWords.ts`**

```ts
import type { WordEntry } from '../types'

export function expandFormsWords(words: WordEntry[]): WordEntry[] {
  const expanded: WordEntry[] = []
  for (const w of words) {
    expanded.push({ word: w.word, meaning: w.meaning, note: w.note })
    if (w.comparative) {
      expanded.push({ word: w.comparative, meaning: `${w.word} ${w.meaning}`, note: '比较级' })
    }
    if (w.superlative) {
      expanded.push({ word: w.superlative, meaning: `${w.word} ${w.meaning}`, note: '最高级' })
    }
  }
  return expanded
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npm run test:run
```

Expected: all tests pass (8 existing + 4 new = 12 total)

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/lib/expandFormsWords.ts src/lib/expandFormsWords.test.ts
git commit -m "feat: add comparative/superlative fields to WordEntry and expandFormsWords utility"
```

---

## Task 3: Create FormListPage

**Files:**
- Create: `src/pages/FormListPage.tsx`

### Context: how ErrorPreviewPage navigates to the play page

`ErrorPreviewPage` calls `navigate('/quiz/errors/play', { state: { words } })`. `FormListPage` follows the same pattern but passes `{ words, unit: 'forms' }` and navigates to `/quiz/forms/play`.

### Context: how WordListPage fetches and displays lists

`WordListPage` (`src/pages/WordListPage.tsx`) calls `api.getWordListIndex()` and renders cards as `<Link>` components. Since `FormListPage` must fetch each word list on click (to expand it), cards are `<button>` elements instead of links.

- [ ] **Step 1: Create `src/pages/FormListPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { expandFormsWords } from '../lib/expandFormsWords'
import type { WordListIndex } from '../types'

export default function FormListPage() {
  const navigate = useNavigate()
  const [lists, setLists] = useState<WordListIndex[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    api.getWordListIndex()
      .then(all => setLists(all.filter(item => item.hasComparatives)))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  const handleStart = async (file: string) => {
    setStarting(file)
    try {
      const wordList = await api.getWordList(file)
      const words = expandFormsWords(wordList.words)
      navigate('/quiz/forms/play', { state: { words, unit: 'forms' } })
    } catch {
      setLoadError(true)
      setStarting(null)
    }
  }

  if (loading) return <p className="p-4 text-gray-500">加载中…</p>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/home" className="text-sm text-indigo-600 hover:text-indigo-700">← 返回</Link>
      <h2 className="text-lg font-semibold text-gray-900 mt-4 mb-3">选择词库</h2>
      {loadError && <p className="text-red-600 text-sm mb-4">加载失败，请返回重试</p>}
      <div className="flex flex-col gap-3">
        {lists.map(item => (
          <button
            key={item.file}
            onClick={() => handleStart(item.file)}
            disabled={starting !== null}
            className="text-left p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            <div className="flex justify-between items-start">
              <strong className="font-semibold text-gray-900">{item.title}</strong>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-2 shrink-0">
                {starting === item.file ? '加载中…' : `${item.total} 词`}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 mb-0">{item.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/FormListPage.tsx
git commit -m "feat: add FormListPage for comparative quiz word list selection"
```

---

## Task 4: Update QuizPlayPage and StatsPage for forms mode

**Files:**
- Modify: `src/pages/QuizPlayPage.tsx`
- Modify: `src/pages/StatsPage.tsx`

### Context: current QuizPlayPage state-words branch (lines 162–174)

```tsx
if (stateWords) {
  if (!stateWords.length) {
    navigate('/quiz/errors', { replace: true })
    return
  }
  api.startSession({ student: username, unit: 'errors', mode: 'queue_cycle', total_words: stateWords.length })
    .then(({ session_id }) => {
      startTime.current = Date.now()
      setSessionId(session_id)
      setWords(stateWords)
    })
    .catch(() => navigate('/home'))
  return
}

if (!unitParam) {
  navigate('/quiz/errors', { replace: true })
  return
}
```

### Context: current unit derivation (line 194)

```tsx
const unit = location.state?.words ? 'errors' : (unitParam ?? '')
```

### Three edits needed in QuizPlayPage

**Edit 1** — empty stateWords redirect: use `location.state?.unit` to pick the right fallback route.

**Edit 2** — `startSession` unit: use `location.state?.unit ?? 'errors'` instead of hardcoded `'errors'`.

**Edit 3** — no-unitParam redirect: check pathname to pick correct fallback.

**Edit 4** — `unit` derivation: read from `location.state.unit`.

- [ ] **Step 1: Apply the four edits to `src/pages/QuizPlayPage.tsx`**

Replace the `if (stateWords)` block and the `if (!unitParam)` guard with:

```tsx
if (stateWords) {
  if (!stateWords.length) {
    const fallback = location.state?.unit === 'forms' ? '/quiz/forms' : '/quiz/errors'
    navigate(fallback, { replace: true })
    return
  }
  api.startSession({ student: username, unit: location.state?.unit ?? 'errors', mode: 'queue_cycle', total_words: stateWords.length })
    .then(({ session_id }) => {
      startTime.current = Date.now()
      setSessionId(session_id)
      setWords(stateWords)
    })
    .catch(() => navigate('/home'))
  return
}

if (!unitParam) {
  const fallback = location.pathname.startsWith('/quiz/forms') ? '/quiz/forms' : '/quiz/errors'
  navigate(fallback, { replace: true })
  return
}
```

Replace the `unit` derivation line:

```tsx
const unit = location.state?.words ? (location.state?.unit ?? 'errors') : (unitParam ?? '')
```

- [ ] **Step 2: Update `src/pages/StatsPage.tsx` unit display**

Find the session card's unit display (currently line 59):

```tsx
<strong className="font-semibold text-gray-900">{s.unit === 'errors' ? '错词复习' : s.unit}</strong>
```

Replace with:

```tsx
<strong className="font-semibold text-gray-900">
  {s.unit === 'errors' ? '错词复习' : s.unit === 'forms' ? '比较变化练习' : s.unit}
</strong>
```

- [ ] **Step 3: Run tests**

```bash
npm run test:run
```

Expected: all 12 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/QuizPlayPage.tsx src/pages/StatsPage.tsx
git commit -m "feat: QuizPlayPage and StatsPage support forms quiz mode"
```

---

## Task 5: Wire routes and add mode card to HomePage

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/HomePage.tsx`

### Context: current App.tsx routes (lines 17–29)

```tsx
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/quiz/words" element={<RequireAuth><WordListPage /></RequireAuth>} />
      <Route path="/quiz/words/:unit/play" element={<RequireAuth><QuizPlayPage /></RequireAuth>} />
      <Route path="/quiz/errors" element={<RequireAuth><ErrorPreviewPage /></RequireAuth>} />
      <Route path="/quiz/errors/play" element={<RequireAuth><QuizPlayPage /></RequireAuth>} />
      <Route path="/result" element={<RequireAuth><ResultPage /></RequireAuth>} />
      <Route path="/stats" element={<RequireAuth><StatsPage /></RequireAuth>} />
    </Routes>
  )
}
```

### Context: current HomePage.tsx mode cards (lines 25–39)

```tsx
<h2 className="text-lg font-semibold text-gray-900 mb-3">选择模式</h2>
<div className="flex flex-col gap-3">
  <Link to="/quiz/words" ...>
    <strong>词库练习</strong>
    <p>从词库中选词，循环测验直到全部答对</p>
  </Link>
  <Link to="/quiz/errors" ...>
    <strong>错词复习</strong>
    <p>重新测试统计中的高频错词</p>
  </Link>
</div>
```

- [ ] **Step 1: Add routes to `src/App.tsx`**

Add the `FormListPage` import alongside the other page imports:

```tsx
import FormListPage from './pages/FormListPage'
```

Add two routes inside `<Routes>` after the existing quiz routes:

```tsx
<Route path="/quiz/forms" element={<RequireAuth><FormListPage /></RequireAuth>} />
<Route path="/quiz/forms/play" element={<RequireAuth><QuizPlayPage /></RequireAuth>} />
```

The full updated `AppRoutes`:

```tsx
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/quiz/words" element={<RequireAuth><WordListPage /></RequireAuth>} />
      <Route path="/quiz/words/:unit/play" element={<RequireAuth><QuizPlayPage /></RequireAuth>} />
      <Route path="/quiz/errors" element={<RequireAuth><ErrorPreviewPage /></RequireAuth>} />
      <Route path="/quiz/errors/play" element={<RequireAuth><QuizPlayPage /></RequireAuth>} />
      <Route path="/quiz/forms" element={<RequireAuth><FormListPage /></RequireAuth>} />
      <Route path="/quiz/forms/play" element={<RequireAuth><QuizPlayPage /></RequireAuth>} />
      <Route path="/result" element={<RequireAuth><ResultPage /></RequireAuth>} />
      <Route path="/stats" element={<RequireAuth><StatsPage /></RequireAuth>} />
    </Routes>
  )
}
```

- [ ] **Step 2: Add the third mode card to `src/pages/HomePage.tsx`**

Add a third `<Link>` after the "错词复习" card:

```tsx
<Link
  to="/quiz/forms"
  className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-900 no-underline"
>
  <strong className="font-semibold">比较变化练习</strong>
  <p className="text-sm text-gray-500 mt-1 mb-0">测试形容词、副词的比较级与最高级变化</p>
</Link>
```

- [ ] **Step 3: Run tests and build**

```bash
npm run test:run && npm run build
```

Expected: all 12 tests pass, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/pages/HomePage.tsx
git commit -m "feat: wire /quiz/forms routes and add 比较变化练习 mode card to home"
```

- [ ] **Step 5: Push to GitHub**

```bash
git push
```

# Irregular Verbs Quiz Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parse the 106-word irregular verb list from `wordlist-raw/Irregular Verbs.md`, split it into three JSON word lists, and add a "不规则动词练习" quiz mode where the student sees the verb infinitive and types the past tense.

**Architecture:** Each verb becomes one `WordEntry` with `word = past tense` (what the student types) and `meaning = infinitive` (shown as the prompt) — the same field convention used by forms mode derived cards. A new `VerbListPage` (a simplified `FormListPage` with no expansion step) lets the student pick a group and launches the existing `QuizPlayPage` via `location.state`. Two small fallback-route edits in `QuizPlayPage` and one display line in `StatsPage` complete the integration.

**Tech Stack:** React 19, TypeScript, React Router v6, Tailwind CSS v4, Vite, Node.js (for the one-off parse script)

---

## Codebase orientation

| File | Role |
|---|---|
| `wordlist-raw/Irregular Verbs.md` | Source data — 106 rows, base form + past tense columns |
| `public/wordlists/index.json` | Word list manifest — add 3 new entries with `hasIrregVerbs: true` |
| `src/types.ts` | `WordListIndex` — add `hasIrregVerbs?: boolean` |
| `src/pages/FormListPage.tsx` | Template for `VerbListPage` (same structure, no expansion step) |
| `src/pages/VerbListPage.tsx` | New: list picker for 不规则动词练习 mode |
| `src/App.tsx` | Routes — add `/quiz/verbs` and `/quiz/verbs/play` |
| `src/pages/HomePage.tsx` | Mode selector — add fourth card |
| `src/pages/QuizPlayPage.tsx` | Two fallback-route checks — extend to handle `unit === 'verbs'` |
| `src/pages/StatsPage.tsx` | Unit display — add `'verbs'` → `'不规则动词练习'` |

---

## Task 1: Parse irregular verbs MD and generate JSON files

**Files:**
- Create: `wordlist-raw/parse-irregular-verbs.mjs`
- Create: `public/wordlists/irregverbs-part1.json` (35 words, am/is → forget)
- Create: `public/wordlists/irregverbs-part2.json` (36 words, freeze → rise)
- Create: `public/wordlists/irregverbs-part3.json` (35 words, run → write)
- Modify: `public/wordlists/index.json`

> No unit tests for this task — the script is a one-off generator. Spot-check output with node inline.

- [ ] **Step 1: Write the parse script**

Create `wordlist-raw/parse-irregular-verbs.mjs`:

```js
import { readFileSync, writeFileSync } from 'fs'

const raw = readFileSync('wordlist-raw/Irregular Verbs.md', 'utf8')

// Extract data rows (lines like: | 1 | am / is | was /wɒz; wʌz/ |)
const rows = raw.split('\n')
  .filter(line => /^\|\s*\d+\s*\|/.test(line))
  .map(line => {
    const cols = line.split('|').map(s => s.trim()).filter(Boolean)
    // cols[0]=seq, cols[1]=base form, cols[2]=past tense
    const meaning = stripPhonetics(cols[1])
    const word = primaryForm(stripPhonetics(cols[2]))
    return { word, meaning, note: '过去式' }
  })

// Remove /.../  phonetic notation (must have a closing slash to avoid matching "am / is")
function stripPhonetics(s) {
  return s.replace(/\s*\/[^/]+\//g, '').trim()
}

// Take the first form when multiple are listed (e.g. "burnt, burned" → "burnt")
function primaryForm(s) {
  return s.split(',')[0].trim()
}

const parts = [
  {
    file: 'irregverbs-part1.json',
    title: '不规则动词 第一组',
    description: 'am/is → forget',
    slice: rows.slice(0, 35),
  },
  {
    file: 'irregverbs-part2.json',
    title: '不规则动词 第二组',
    description: 'freeze → rise',
    slice: rows.slice(35, 71),
  },
  {
    file: 'irregverbs-part3.json',
    title: '不规则动词 第三组',
    description: 'run → write',
    slice: rows.slice(71),
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
node wordlist-raw/parse-irregular-verbs.mjs
```

Expected output:
```
✓ 35 words → public/wordlists/irregverbs-part1.json
✓ 36 words → public/wordlists/irregverbs-part2.json
✓ 35 words → public/wordlists/irregverbs-part3.json
```

- [ ] **Step 3: Spot-check the output**

```bash
node -e "
const p1 = JSON.parse(require('fs').readFileSync('public/wordlists/irregverbs-part1.json'));
const p2 = JSON.parse(require('fs').readFileSync('public/wordlists/irregverbs-part2.json'));
const p3 = JSON.parse(require('fs').readFileSync('public/wordlists/irregverbs-part3.json'));
console.log('p1:', p1.meta.total, '|', p1.words[0].meaning, '->', p1.words[0].word, '...', p1.words.at(-1).meaning, '->', p1.words.at(-1).word);
console.log('p2:', p2.meta.total, '|', p2.words[0].meaning, '->', p2.words[0].word, '...', p2.words.at(-1).meaning, '->', p2.words.at(-1).word);
console.log('p3:', p3.meta.total, '|', p3.words[0].meaning, '->', p3.words[0].word, '...', p3.words.at(-1).meaning, '->', p3.words.at(-1).word);
console.log('total:', p1.meta.total + p2.meta.total + p3.meta.total);
const go = p2.words.find(w => w.meaning === 'go');
const burn = p1.words.find(w => w.meaning === 'burn');
const must = p2.words.find(w => w.meaning === 'must');
console.log('go:', go?.word, '| burn:', burn?.word, '| must:', must?.word);
"
```

Expected:
```
p1: 35 | am / is -> was ... forget -> forgot
p2: 36 | freeze -> froze ... rise -> rose
p3: 35 | run -> ran ... write -> wrote
total: 106
go: went | burn: burnt | must: had to
```

- [ ] **Step 4: Update `public/wordlists/index.json`**

Append three new entries at the end of the array (after the existing `year7sem2fc-part3.json` entry):

```json
  {
    "file": "irregverbs-part1.json",
    "title": "不规则动词 第一组",
    "description": "am/is → forget",
    "total": 35,
    "hasIrregVerbs": true
  },
  {
    "file": "irregverbs-part2.json",
    "title": "不规则动词 第二组",
    "description": "freeze → rise",
    "total": 36,
    "hasIrregVerbs": true
  },
  {
    "file": "irregverbs-part3.json",
    "title": "不规则动词 第三组",
    "description": "run → write",
    "total": 35,
    "hasIrregVerbs": true
  }
```

The full updated `public/wordlists/index.json`:

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
  },
  {
    "file": "irregverbs-part1.json",
    "title": "不规则动词 第一组",
    "description": "am/is → forget",
    "total": 35,
    "hasIrregVerbs": true
  },
  {
    "file": "irregverbs-part2.json",
    "title": "不规则动词 第二组",
    "description": "freeze → rise",
    "total": 36,
    "hasIrregVerbs": true
  },
  {
    "file": "irregverbs-part3.json",
    "title": "不规则动词 第三组",
    "description": "run → write",
    "total": 35,
    "hasIrregVerbs": true
  }
]
```

- [ ] **Step 5: Commit**

```bash
git add wordlist-raw/parse-irregular-verbs.mjs public/wordlists/irregverbs-part1.json public/wordlists/irregverbs-part2.json public/wordlists/irregverbs-part3.json public/wordlists/index.json
git commit -m "feat: generate irregular verb word lists from MD source"
```

---

## Task 2: Add type flag and create VerbListPage

**Files:**
- Modify: `src/types.ts`
- Create: `src/pages/VerbListPage.tsx`

### Context: current `WordListIndex` (src/types.ts lines 23–29)

```ts
export interface WordListIndex {
  file: string
  title: string
  description: string
  total: number
  hasComparatives?: boolean
}
```

### Context: FormListPage pattern (src/pages/FormListPage.tsx)

`VerbListPage` is identical to `FormListPage` except:
1. Filters by `hasIrregVerbs` instead of `hasComparatives`
2. No `expandFormsWords` call — passes `wordList.words` directly
3. Navigates to `/quiz/verbs/play` with `unit: 'verbs'`

- [ ] **Step 1: Add `hasIrregVerbs` to `WordListIndex` in `src/types.ts`**

Find the `WordListIndex` interface and add the new optional field:

```ts
export interface WordListIndex {
  file: string
  title: string
  description: string
  total: number
  hasComparatives?: boolean
  hasIrregVerbs?: boolean
}
```

- [ ] **Step 2: Create `src/pages/VerbListPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { WordListIndex } from '../types'

export default function VerbListPage() {
  const navigate = useNavigate()
  const [lists, setLists] = useState<WordListIndex[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    api.getWordListIndex()
      .then(all => setLists(all.filter(item => item.hasIrregVerbs)))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  const handleStart = async (file: string) => {
    setStarting(file)
    try {
      const wordList = await api.getWordList(file)
      navigate('/quiz/verbs/play', { state: { words: wordList.words, unit: 'verbs' } })
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

- [ ] **Step 3: Run tests and verify build**

```bash
npm run test:run && npm run build
```

Expected: 12 tests pass, build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/pages/VerbListPage.tsx
git commit -m "feat: add VerbListPage and hasIrregVerbs type flag"
```

---

## Task 3: Wire routes and integrate with existing pages

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/QuizPlayPage.tsx`
- Modify: `src/pages/StatsPage.tsx`

### Context: current App.tsx (full file)

```tsx
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import WordListPage from './pages/WordListPage'
import ErrorPreviewPage from './pages/ErrorPreviewPage'
import FormListPage from './pages/FormListPage'
import QuizPlayPage from './pages/QuizPlayPage'
import ResultPage from './pages/ResultPage'
import StatsPage from './pages/StatsPage'

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { username } = useAuth()
  return username ? children : <Navigate to="/" replace />
}

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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
```

### Context: current QuizPlayPage fallback lines (src/pages/QuizPlayPage.tsx)

Line 164 — empty stateWords redirect:
```tsx
const fallback = location.state?.unit === 'forms' ? '/quiz/forms' : '/quiz/errors'
```

Line 179 — no-unitParam redirect:
```tsx
const fallback = location.pathname.startsWith('/quiz/forms') ? '/quiz/forms' : '/quiz/errors'
```

### Context: current StatsPage unit display (src/pages/StatsPage.tsx lines 79–81)

```tsx
<strong className="font-semibold text-gray-900">
  {s.unit === 'errors' ? '错词复习' : s.unit === 'forms' ? '比较变化练习' : s.unit}
</strong>
```

### Context: current HomePage mode cards (src/pages/HomePage.tsx lines 26–46)

```tsx
<div className="flex flex-col gap-3">
  <Link to="/quiz/words" className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-900 no-underline">
    <strong className="font-semibold">词库练习</strong>
    <p className="text-sm text-gray-500 mt-1 mb-0">从词库中选词，循环测验直到全部答对</p>
  </Link>
  <Link to="/quiz/errors" className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-900 no-underline">
    <strong className="font-semibold">错词复习</strong>
    <p className="text-sm text-gray-500 mt-1 mb-0">重新测试统计中的高频错词</p>
  </Link>
  <Link to="/quiz/forms" className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-900 no-underline">
    <strong className="font-semibold">比较变化练习</strong>
    <p className="text-sm text-gray-500 mt-1 mb-0">测试形容词、副词的比较级与最高级变化</p>
  </Link>
</div>
```

- [ ] **Step 1: Update `src/App.tsx`**

Add the `VerbListPage` import after the `FormListPage` import:

```tsx
import VerbListPage from './pages/VerbListPage'
```

Add two routes after `/quiz/forms/play` and before `/result`:

```tsx
<Route path="/quiz/verbs" element={<RequireAuth><VerbListPage /></RequireAuth>} />
<Route path="/quiz/verbs/play" element={<RequireAuth><QuizPlayPage /></RequireAuth>} />
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
      <Route path="/quiz/verbs" element={<RequireAuth><VerbListPage /></RequireAuth>} />
      <Route path="/quiz/verbs/play" element={<RequireAuth><QuizPlayPage /></RequireAuth>} />
      <Route path="/result" element={<RequireAuth><ResultPage /></RequireAuth>} />
      <Route path="/stats" element={<RequireAuth><StatsPage /></RequireAuth>} />
    </Routes>
  )
}
```

- [ ] **Step 2: Add fourth mode card to `src/pages/HomePage.tsx`**

Add a `<Link>` after the "比较变化练习" card, inside the same `<div className="flex flex-col gap-3">`:

```tsx
<Link
  to="/quiz/verbs"
  className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-900 no-underline"
>
  <strong className="font-semibold">不规则动词练习</strong>
  <p className="text-sm text-gray-500 mt-1 mb-0">给出动词原形，填写对应的过去式</p>
</Link>
```

- [ ] **Step 3: Update fallback routes in `src/pages/QuizPlayPage.tsx`**

**Edit 1** — replace line 164 (empty stateWords fallback):

Old:
```tsx
const fallback = location.state?.unit === 'forms' ? '/quiz/forms' : '/quiz/errors'
```

New:
```tsx
const fallback = location.state?.unit === 'forms' ? '/quiz/forms'
  : location.state?.unit === 'verbs' ? '/quiz/verbs'
  : '/quiz/errors'
```

**Edit 2** — replace line 179 (no-unitParam fallback):

Old:
```tsx
const fallback = location.pathname.startsWith('/quiz/forms') ? '/quiz/forms' : '/quiz/errors'
```

New:
```tsx
const fallback = location.pathname.startsWith('/quiz/forms') ? '/quiz/forms'
  : location.pathname.startsWith('/quiz/verbs') ? '/quiz/verbs'
  : '/quiz/errors'
```

- [ ] **Step 4: Update unit display in `src/pages/StatsPage.tsx`**

Old (lines 79–81):
```tsx
<strong className="font-semibold text-gray-900">
  {s.unit === 'errors' ? '错词复习' : s.unit === 'forms' ? '比较变化练习' : s.unit}
</strong>
```

New:
```tsx
<strong className="font-semibold text-gray-900">
  {s.unit === 'errors' ? '错词复习' : s.unit === 'forms' ? '比较变化练习' : s.unit === 'verbs' ? '不规则动词练习' : s.unit}
</strong>
```

- [ ] **Step 5: Run tests and build**

```bash
npm run test:run && npm run build
```

Expected: 12 tests pass, build succeeds with no errors.

- [ ] **Step 6: Commit and push**

```bash
git add src/App.tsx src/pages/HomePage.tsx src/pages/QuizPlayPage.tsx src/pages/StatsPage.tsx
git commit -m "feat: wire /quiz/verbs routes and add 不规则动词练习 mode"
git push
```

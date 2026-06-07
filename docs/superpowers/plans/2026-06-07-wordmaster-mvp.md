# WordMaster MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a vocabulary drilling web app on Cloudflare Pages where students log in by username, pick a word list, and drill until every word is answered correctly (Mode B: wrong words cycle to the end of the queue).

**Architecture:** React + Vite static frontend on Cloudflare Pages; Pages Functions serve `/api/*` routes bound to a D1 database; word lists are static JSON assets in `public/wordlists/` fetched directly by the browser; a `students` table plus a single `quiz_events` event-log table handle all persistence.

**Tech Stack:** React 18, TypeScript, React Router v6, Vite, Cloudflare Pages, Pages Functions, D1 (SQLite), Web Speech API, Vitest, @testing-library/react

---

## File Map

| File | Responsibility |
|------|----------------|
| `wrangler.toml` | CF Pages build output dir + D1 binding |
| `migrations/0001_init.sql` | D1 schema creation |
| `src/types.ts` | Shared TypeScript types |
| `src/lib/api.ts` | Typed `fetch` wrappers for all `/api/*` calls and static word list files |
| `functions/api/login.ts` | POST `/api/login` |
| `functions/api/session/start.ts` | POST `/api/session/start` |
| `functions/api/session/word.ts` | POST `/api/session/word` |
| `functions/api/session/complete.ts` | POST `/api/session/complete` |
| `functions/api/student/[username]/stats.ts` | GET `/api/student/:username/stats` |
| `public/wordlists/index.json` | Word list manifest |
| `public/wordlists/unit1.json` | Sample word list |
| `src/context/AuthContext.tsx` | Username state persisted in sessionStorage |
| `src/App.tsx` | React Router setup + auth guard |
| `src/main.tsx` | App entry point |
| `src/pages/LoginPage.tsx` | Username entry form |
| `src/pages/HomePage.tsx` | Word list selection grid |
| `src/pages/QuizConfigPage.tsx` | Mode selection before quiz |
| `src/hooks/useQuiz.ts` | Mode B queue-cycle quiz state machine |
| `src/components/WordCard.tsx` | Meaning display + pronunciation button |
| `src/pages/QuizPlayPage.tsx` | Active quiz: word card + answer input |
| `src/pages/ResultPage.tsx` | Session summary after completion |
| `src/pages/StatsPage.tsx` | Student history + high-error words |

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx` (via Vite template)
- Create: `src/test-setup.ts`

- [ ] **Step 1: Scaffold Vite + React + TypeScript**

Run in the repo root (existing files like `CLAUDE.md` and `docs/` will not be overwritten):

```bash
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty. Please choose how to proceed:", select **Ignore files and continue**.

- [ ] **Step 2: Install dependencies**

```bash
npm install react-router-dom
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Replace `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 4: Create `src/test-setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add scripts to `package.json`**

In the `"scripts"` section, add:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 6: Replace `src/index.css` with minimal reset**

```css
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; }
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite starts on `http://localhost:5173`. Stop with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold React + Vite + TypeScript project"
```

---

### Task 2: Wrangler Configuration

**Files:**
- Create: `wrangler.toml`

- [ ] **Step 1: Install Wrangler and workers types**

```bash
npm install --save-dev wrangler @cloudflare/workers-types
```

- [ ] **Step 2: Create `wrangler.toml`**

```toml
name = "wordmaster"
compatibility_date = "2024-09-23"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "wordmaster-db"
database_id = "PLACEHOLDER"
```

> `database_id` is replaced with the real ID after creating the D1 database in CF console. For local dev Wrangler uses a local SQLite file regardless.

Each `functions/**/*.ts` file will include a triple-slash reference at the top to get Workers types without conflicting with the DOM types used in React:

```typescript
/// <reference types="@cloudflare/workers-types" />
```

This reference is shown in each function task below.

- [ ] **Step 3: Commit**

```bash
git add wrangler.toml package.json package-lock.json
git commit -m "feat: add Wrangler config and CF workers-types"
```

---

### Task 3: D1 Migration

**Files:**
- Create: `migrations/0001_init.sql`

- [ ] **Step 1: Create migrations directory**

```bash
mkdir -p migrations
```

- [ ] **Step 2: Write `migrations/0001_init.sql`**

```sql
CREATE TABLE IF NOT EXISTS students (
  username   TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  student    TEXT NOT NULL,
  event_type TEXT NOT NULL,
  unit       TEXT,
  word       TEXT,
  correct    INTEGER,
  meta       TEXT,
  ts         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student ON quiz_events(student);
CREATE INDEX IF NOT EXISTS idx_student_unit ON quiz_events(student, unit);
CREATE INDEX IF NOT EXISTS idx_student_event ON quiz_events(student, event_type);
```

- [ ] **Step 3: Apply migration locally**

```bash
npx wrangler d1 execute wordmaster-db --local --file=migrations/0001_init.sql
```

Expected:
```
✅ Successfully executed 5 commands from migrations/0001_init.sql
```

- [ ] **Step 4: Commit**

```bash
git add migrations/0001_init.sql
git commit -m "feat: add D1 schema migration"
```

---

### Task 4: Shared TypeScript Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write `src/types.ts`**

```typescript
export interface WordEntry {
  word: string
  meaning: string
  note: string
  image?: string
  example?: string
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
}

export interface Student {
  username: string
  created_at: number
}

export interface SessionStartResponse {
  session_id: number
}

export interface SessionSummary {
  session_id: number
  unit: string
  started_at: number
  finished_at: number | null
  rounds: number | null
  duration_ms: number | null
}

export interface WordErrorStat {
  word: string
  unit: string
  total_attempts: number
  correct_count: number
}

export interface StudentStats {
  sessions: SessionSummary[]
  high_error_words: WordErrorStat[]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 5: Login API Endpoint

**Files:**
- Create: `functions/api/login.ts`

- [ ] **Step 1: Create functions directory**

```bash
mkdir -p functions/api
```

- [ ] **Step 2: Write `functions/api/login.ts`**

```typescript
/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { username?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const username = body.username?.trim()
  if (!username) {
    return Response.json({ error: 'username required' }, { status: 400 })
  }

  const now = Date.now()
  await env.DB.prepare(
    'INSERT OR IGNORE INTO students (username, created_at) VALUES (?, ?)'
  ).bind(username, now).run()

  const student = await env.DB.prepare(
    'SELECT username, created_at FROM students WHERE username = ?'
  ).bind(username).first<{ username: string; created_at: number }>()

  return Response.json(student)
}
```

- [ ] **Step 3: Start dev server and test**

```bash
npx wrangler pages dev -- npm run dev
```

In a second terminal:

```bash
curl -s -X POST http://localhost:8788/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice"}' | jq
```

Expected:
```json
{ "username": "alice", "created_at": 1717000000000 }
```

Run again with the same username — `created_at` must be identical (existing record returned).

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add functions/api/login.ts
git commit -m "feat: add login API endpoint"
```

---

### Task 6: Session Start API

**Files:**
- Create: `functions/api/session/start.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p functions/api/session
```

- [ ] **Step 2: Write `functions/api/session/start.ts`**

```typescript
/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database
}

interface StartBody {
  student: string
  unit: string
  mode: string
  total_words: number
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: StartBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { student, unit, mode, total_words } = body
  if (!student || !unit || !mode || !total_words) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const meta = JSON.stringify({ mode, total_words })
  const result = await env.DB.prepare(
    'INSERT INTO quiz_events (student, event_type, unit, meta, ts) VALUES (?, ?, ?, ?, ?)'
  ).bind(student, 'session_start', unit, meta, Date.now()).run()

  return Response.json({ session_id: result.meta.last_row_id })
}
```

- [ ] **Step 3: Test with curl**

Start dev server, then:

```bash
curl -s -X POST http://localhost:8788/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"student":"alice","unit":"unit1","mode":"queue_cycle","total_words":5}' | jq
```

Expected: `{ "session_id": 1 }`

- [ ] **Step 4: Commit**

```bash
git add functions/api/session/start.ts
git commit -m "feat: add session start API endpoint"
```

---

### Task 7: Session Word API

**Files:**
- Create: `functions/api/session/word.ts`

- [ ] **Step 1: Write `functions/api/session/word.ts`**

```typescript
/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database
}

interface WordBody {
  session_id: number
  student: string
  unit: string
  word: string
  correct: 0 | 1
  attempt_number: number
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: WordBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { session_id, student, unit, word, correct, attempt_number } = body
  if (!session_id || !student || !unit || !word || correct === undefined || !attempt_number) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const meta = JSON.stringify({ session_id, attempt_number })
  await env.DB.prepare(
    'INSERT INTO quiz_events (student, event_type, unit, word, correct, meta, ts) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(student, 'word_attempt', unit, word, correct, meta, Date.now()).run()

  return Response.json({ ok: true })
}
```

- [ ] **Step 2: Test with curl**

```bash
curl -s -X POST http://localhost:8788/api/session/word \
  -H "Content-Type: application/json" \
  -d '{"session_id":1,"student":"alice","unit":"unit1","word":"abundant","correct":0,"attempt_number":1}' | jq
```

Expected: `{ "ok": true }`

- [ ] **Step 3: Commit**

```bash
git add functions/api/session/word.ts
git commit -m "feat: add session word attempt API endpoint"
```

---

### Task 8: Session Complete API

**Files:**
- Create: `functions/api/session/complete.ts`

- [ ] **Step 1: Write `functions/api/session/complete.ts`**

```typescript
/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database
}

interface CompleteBody {
  session_id: number
  student: string
  unit: string
  rounds: number
  duration_ms: number
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: CompleteBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { session_id, student, unit, rounds, duration_ms } = body
  if (!session_id || !student || !unit || rounds === undefined || duration_ms === undefined) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const meta = JSON.stringify({ session_id, rounds, duration_ms })
  await env.DB.prepare(
    'INSERT INTO quiz_events (student, event_type, unit, meta, ts) VALUES (?, ?, ?, ?, ?)'
  ).bind(student, 'session_complete', unit, meta, Date.now()).run()

  return Response.json({ ok: true })
}
```

- [ ] **Step 2: Test with curl**

```bash
curl -s -X POST http://localhost:8788/api/session/complete \
  -H "Content-Type: application/json" \
  -d '{"session_id":1,"student":"alice","unit":"unit1","rounds":2,"duration_ms":180000}' | jq
```

Expected: `{ "ok": true }`

- [ ] **Step 3: Commit**

```bash
git add functions/api/session/complete.ts
git commit -m "feat: add session complete API endpoint"
```

---

### Task 9: Stats API

**Files:**
- Create: `functions/api/student/[username]/stats.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p "functions/api/student/[username]"
```

- [ ] **Step 2: Write `functions/api/student/[username]/stats.ts`**

```typescript
/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const username = Array.isArray(params.username) ? params.username[0] : params.username
  if (!username) {
    return Response.json({ error: 'username required' }, { status: 400 })
  }

  const starts = await env.DB.prepare(
    `SELECT id, unit, ts, meta FROM quiz_events
     WHERE student = ? AND event_type = 'session_start'
     ORDER BY ts DESC LIMIT 50`
  ).bind(username).all<{ id: number; unit: string; ts: number; meta: string }>()

  const completes = await env.DB.prepare(
    `SELECT meta, ts FROM quiz_events
     WHERE student = ? AND event_type = 'session_complete'`
  ).bind(username).all<{ meta: string; ts: number }>()

  const completeMap = new Map<number, { rounds: number; duration_ms: number; ts: number }>()
  for (const c of completes.results) {
    const m = JSON.parse(c.meta)
    completeMap.set(m.session_id, { rounds: m.rounds, duration_ms: m.duration_ms, ts: c.ts })
  }

  const sessions = starts.results.map(s => {
    const complete = completeMap.get(s.id)
    return {
      session_id: s.id,
      unit: s.unit,
      started_at: s.ts,
      finished_at: complete?.ts ?? null,
      rounds: complete?.rounds ?? null,
      duration_ms: complete?.duration_ms ?? null,
    }
  })

  const wordStats = await env.DB.prepare(
    `SELECT word, unit, COUNT(*) as total_attempts, SUM(correct) as correct_count
     FROM quiz_events
     WHERE student = ? AND event_type = 'word_attempt'
     GROUP BY word, unit
     HAVING total_attempts > 1
     ORDER BY (CAST(correct_count AS REAL) / total_attempts) ASC
     LIMIT 20`
  ).bind(username).all<{ word: string; unit: string; total_attempts: number; correct_count: number }>()

  return Response.json({
    sessions,
    high_error_words: wordStats.results,
  })
}
```

- [ ] **Step 3: Test with curl**

After completing the curl tests from Tasks 5–8, run:

```bash
curl -s http://localhost:8788/api/student/alice/stats | jq
```

Expected:
```json
{
  "sessions": [
    {
      "session_id": 1,
      "unit": "unit1",
      "started_at": 1717000000000,
      "finished_at": 1717000180000,
      "rounds": 2,
      "duration_ms": 180000
    }
  ],
  "high_error_words": []
}
```

- [ ] **Step 4: Commit**

```bash
git add "functions/api/student/[username]/stats.ts"
git commit -m "feat: add student stats API endpoint"
```

---

### Task 10: Sample Word Lists

**Files:**
- Create: `public/wordlists/index.json`
- Create: `public/wordlists/unit1.json`

- [ ] **Step 1: Create directory**

```bash
mkdir -p public/wordlists
```

- [ ] **Step 2: Create `public/wordlists/index.json`**

```json
[
  {
    "file": "unit1.json",
    "title": "Unit 1",
    "description": "示例词库 — 常用基础词汇",
    "total": 5
  }
]
```

- [ ] **Step 3: Create `public/wordlists/unit1.json`**

```json
{
  "meta": {
    "title": "Unit 1",
    "description": "示例词库 — 常用基础词汇",
    "total": 5
  },
  "words": [
    { "word": "abundant", "meaning": "大量的；充裕的", "note": "" },
    { "word": "consequence", "meaning": "后果；结果", "note": "常用短语：as a consequence of" },
    { "word": "distinguish", "meaning": "区分；辨别", "note": "distinguish A from B" },
    { "word": "inevitable", "meaning": "不可避免的", "note": "" },
    { "word": "run out of", "meaning": "用完；耗尽", "note": "固定搭配，后接名词" }
  ]
}
```

- [ ] **Step 4: Verify static serving**

Start `npm run dev`, navigate to `http://localhost:5173/wordlists/unit1.json`.

Expected: JSON file displayed in browser.

- [ ] **Step 5: Commit**

```bash
git add public/wordlists/
git commit -m "feat: add sample word lists"
```

---

### Task 11: API Client

**Files:**
- Create: `src/lib/api.ts`

- [ ] **Step 1: Create lib directory**

```bash
mkdir -p src/lib
```

- [ ] **Step 2: Write `src/lib/api.ts`**

```typescript
import type {
  Student,
  WordListIndex,
  WordList,
  SessionStartResponse,
  StudentStats,
} from '../types'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
  return res.json()
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

export const api = {
  login: (username: string) =>
    post<Student>('/api/login', { username }),

  getWordListIndex: () =>
    get<WordListIndex[]>('/wordlists/index.json'),

  getWordList: (file: string) =>
    get<WordList>(`/wordlists/${file}`),

  startSession: (params: { student: string; unit: string; mode: string; total_words: number }) =>
    post<SessionStartResponse>('/api/session/start', params),

  recordWord: (params: {
    session_id: number
    student: string
    unit: string
    word: string
    correct: 0 | 1
    attempt_number: number
  }) => post<{ ok: boolean }>('/api/session/word', params),

  completeSession: (params: {
    session_id: number
    student: string
    unit: string
    rounds: number
    duration_ms: number
  }) => post<{ ok: boolean }>('/api/session/complete', params),

  getStats: (username: string) =>
    get<StudentStats>(`/api/student/${encodeURIComponent(username)}/stats`),
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add typed API client"
```

---

### Task 12: Quiz Engine Hook with Tests

**Files:**
- Create: `src/hooks/useQuiz.ts`
- Create: `src/hooks/useQuiz.test.ts`

Tests first — this is the core business logic.

- [ ] **Step 1: Create hooks directory**

```bash
mkdir -p src/hooks
```

- [ ] **Step 2: Write `src/hooks/useQuiz.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQuiz } from './useQuiz'
import type { WordEntry } from '../types'

const threeWords: WordEntry[] = [
  { word: 'apple', meaning: '苹果', note: '' },
  { word: 'banana', meaning: '香蕉', note: '' },
  { word: 'cherry', meaning: '樱桃', note: '' },
]

describe('useQuiz', () => {
  it('starts with all words in queue and not complete', () => {
    const { result } = renderHook(() => useQuiz(threeWords))
    expect(result.current.remaining).toBe(3)
    expect(result.current.current).not.toBeNull()
    expect(result.current.isComplete).toBe(false)
    expect(result.current.rounds).toBe(1)
  })

  it('correct answer removes word from queue', () => {
    const { result } = renderHook(() => useQuiz(threeWords))
    const word = result.current.current!.word
    act(() => { result.current.submit(word) })
    expect(result.current.remaining).toBe(2)
  })

  it('wrong answer puts word at end, queue size unchanged', () => {
    const { result } = renderHook(() => useQuiz([
      { word: 'apple', meaning: '苹果', note: '' },
      { word: 'banana', meaning: '香蕉', note: '' },
    ]))
    act(() => { result.current.submit('wrong') })
    expect(result.current.remaining).toBe(2)
  })

  it('answer matching is case-insensitive and trims whitespace', () => {
    const { result } = renderHook(() => useQuiz([
      { word: 'apple', meaning: '苹果', note: '' },
    ]))
    let outcome = { correct: false }
    act(() => { outcome = result.current.submit('  Apple  ') })
    expect(outcome.correct).toBe(true)
  })

  it('returns correct:false for wrong answer', () => {
    const { result } = renderHook(() => useQuiz(threeWords))
    let outcome = { correct: true }
    act(() => { outcome = result.current.submit('wrong') })
    expect(outcome.correct).toBe(false)
  })

  it('completes when last word answered correctly', () => {
    const { result } = renderHook(() => useQuiz([
      { word: 'apple', meaning: '苹果', note: '' },
    ]))
    act(() => { result.current.submit('apple') })
    expect(result.current.isComplete).toBe(true)
    expect(result.current.current).toBeNull()
  })

  it('does not increment rounds when all words answered correctly in first pass', () => {
    const twoWords: WordEntry[] = [
      { word: 'apple', meaning: '苹果', note: '' },
      { word: 'banana', meaning: '香蕉', note: '' },
    ]
    const { result } = renderHook(() => useQuiz(twoWords))
    act(() => { result.current.submit(result.current.current!.word) })
    act(() => { result.current.submit(result.current.current!.word) })
    expect(result.current.isComplete).toBe(true)
    expect(result.current.rounds).toBe(1)
  })

  it('increments rounds after all initial words have been seen once', () => {
    const { result } = renderHook(() => useQuiz([
      { word: 'apple', meaning: '苹果', note: '' },
    ]))
    // Wrong answer → word seen, pass complete → new round
    act(() => { result.current.submit('wrong') })
    expect(result.current.rounds).toBe(2)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm run test:run -- src/hooks/useQuiz.test.ts
```

Expected: FAIL — "Cannot find module './useQuiz'"

- [ ] **Step 4: Write `src/hooks/useQuiz.ts`**

```typescript
import { useState, useCallback, useRef } from 'react'
import type { WordEntry } from '../types'

interface QuizResult {
  correct: boolean
}

interface UseQuizReturn {
  current: WordEntry | null
  remaining: number
  rounds: number
  isComplete: boolean
  submit: (answer: string) => QuizResult
}

export function useQuiz(words: WordEntry[]): UseQuizReturn {
  const initialCount = useRef(words.length)
  const shuffled = useRef([...words].sort(() => Math.random() - 0.5))
  const [queue, setQueue] = useState<WordEntry[]>(shuffled.current)
  const [isComplete, setIsComplete] = useState(false)
  const [rounds, setRounds] = useState(1)
  const seenThisPass = useRef(new Set<string>())

  const submit = useCallback((answer: string): QuizResult => {
    if (!queue.length || isComplete) return { correct: false }

    const current = queue[0]
    const correct = answer.trim().toLowerCase() === current.word.toLowerCase()

    seenThisPass.current.add(current.word)

    // When all initial words have been seen once, a new pass begins
    if (seenThisPass.current.size >= initialCount.current) {
      seenThisPass.current.clear()
      // Don't increment if this correct answer ends the session
      if (!correct || queue.length > 1) {
        setRounds(r => r + 1)
      }
    }

    setQueue(prev => {
      if (correct) {
        const next = prev.slice(1)
        if (next.length === 0) setIsComplete(true)
        return next
      }
      return [...prev.slice(1), prev[0]]
    })

    return { correct }
  }, [queue, isComplete])

  return {
    current: queue[0] ?? null,
    remaining: queue.length,
    rounds,
    isComplete,
    submit,
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test:run -- src/hooks/useQuiz.test.ts
```

Expected: All 8 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useQuiz.ts src/hooks/useQuiz.test.ts
git commit -m "feat: add Mode B quiz engine hook with tests"
```

---

### Task 13: Auth Context and App Routing

**Files:**
- Create: `src/context/AuthContext.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create `src/context/AuthContext.tsx`**

```typescript
import { createContext, useContext, useState, type ReactNode } from 'react'

interface AuthContextValue {
  username: string | null
  login: (username: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'wm_username'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(
    () => sessionStorage.getItem(STORAGE_KEY)
  )

  const login = (name: string) => {
    sessionStorage.setItem(STORAGE_KEY, name)
    setUsername(name)
  }

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ username, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Write `src/App.tsx`**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import QuizConfigPage from './pages/QuizConfigPage'
import QuizPlayPage from './pages/QuizPlayPage'
import ResultPage from './pages/ResultPage'
import StatsPage from './pages/StatsPage'

function RequireAuth({ children }: { children: JSX.Element }) {
  const { username } = useAuth()
  return username ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/quiz/:unit" element={<RequireAuth><QuizConfigPage /></RequireAuth>} />
      <Route path="/quiz/:unit/play" element={<RequireAuth><QuizPlayPage /></RequireAuth>} />
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

- [ ] **Step 3: Update `src/main.tsx`**

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 4: Commit**

```bash
git add src/context/AuthContext.tsx src/App.tsx src/main.tsx
git commit -m "feat: add auth context and React Router setup"
```

---

### Task 14: Login Page

**Files:**
- Create: `src/pages/LoginPage.tsx`

- [ ] **Step 1: Create pages directory**

```bash
mkdir -p src/pages
```

- [ ] **Step 2: Write `src/pages/LoginPage.tsx`**

```typescript
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export default function LoginPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const username = input.trim()
    if (!username) return
    setLoading(true)
    setError('')
    try {
      await api.login(username)
      login(username)
      navigate('/home')
    } catch {
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '20vh auto', padding: '0 16px' }}>
      <h1>WordMaster</h1>
      <p>输入你的账号名开始学习</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="账号名"
          autoFocus
          style={{ width: '100%', padding: '8px', fontSize: 16, marginBottom: 8 }}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{ width: '100%', padding: '10px', fontSize: 16 }}
        >
          {loading ? '登录中…' : '开始'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/LoginPage.tsx
git commit -m "feat: add login page"
```

---

### Task 15: Home Page

**Files:**
- Create: `src/pages/HomePage.tsx`

- [ ] **Step 1: Write `src/pages/HomePage.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { WordListIndex } from '../types'

export default function HomePage() {
  const { username, logout } = useAuth()
  const [lists, setLists] = useState<WordListIndex[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.getWordListIndex()
      .then(setLists)
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>WordMaster</h1>
        <div>
          <span style={{ marginRight: 12 }}>👤 {username}</span>
          <Link to="/stats" style={{ marginRight: 12 }}>我的统计</Link>
          <button onClick={handleLogout}>退出</button>
        </div>
      </div>
      <h2>选择词库</h2>
      {loading && <p>加载中…</p>}
      <div style={{ display: 'grid', gap: 12 }}>
        {lists.map(item => (
          <Link
            key={item.file}
            to={`/quiz/${item.file.replace('.json', '')}`}
            style={{
              display: 'block',
              padding: 16,
              border: '1px solid #ddd',
              borderRadius: 8,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <strong>{item.title}</strong>
            <p style={{ margin: '4px 0 0', color: '#666' }}>{item.description}</p>
            <small>{item.total} 个词</small>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat: add home page with word list selection"
```

---

### Task 16: Quiz Config Page

**Files:**
- Create: `src/pages/QuizConfigPage.tsx`

- [ ] **Step 1: Write `src/pages/QuizConfigPage.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { WordListMeta } from '../types'

export default function QuizConfigPage() {
  const { unit } = useParams<{ unit: string }>()
  const navigate = useNavigate()
  const [meta, setMeta] = useState<WordListMeta | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!unit) return
    api.getWordList(`${unit}.json`)
      .then(data => setMeta(data.meta))
      .finally(() => setLoading(false))
  }, [unit])

  if (loading) return <p style={{ padding: 16 }}>加载中…</p>
  if (!meta) return <p style={{ padding: 16 }}>词库不存在</p>

  return (
    <div style={{ maxWidth: 400, margin: '10vh auto', padding: '0 16px' }}>
      <Link to="/home">← 返回</Link>
      <h2>{meta.title}</h2>
      <p>{meta.description}</p>
      <p>共 {meta.total} 个词</p>
      <h3>选择模式</h3>
      <div style={{
        padding: 16,
        border: '2px solid #333',
        borderRadius: 8,
        marginBottom: 16,
      }}>
        <strong>循环队列模式</strong>
        <p style={{ margin: '4px 0 0', color: '#555' }}>
          答错放回队尾，全部答对才完成
        </p>
      </div>
      <button
        onClick={() => navigate(`/quiz/${unit}/play`)}
        style={{ width: '100%', padding: '10px', fontSize: 16 }}
      >
        开始测验
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/QuizConfigPage.tsx
git commit -m "feat: add quiz config page"
```

---

### Task 17: WordCard Component

**Files:**
- Create: `src/components/WordCard.tsx`

- [ ] **Step 1: Create components directory**

```bash
mkdir -p src/components
```

- [ ] **Step 2: Write `src/components/WordCard.tsx`**

```typescript
import type { WordEntry } from '../types'

interface Props {
  word: WordEntry
  remaining: number
  rounds: number
}

export default function WordCard({ word, remaining, rounds }: Props) {
  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(word.word)
    utterance.lang = 'en-US'
    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
  }

  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{ color: '#888', marginBottom: 8 }}>
        剩余 {remaining} 词 · 第 {rounds} 轮
      </div>
      <div style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>
        {word.meaning}
      </div>
      {word.note && (
        <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>
          {word.note}
        </div>
      )}
      <button
        onClick={speak}
        style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}
        title="朗读单词"
      >
        🔊
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/WordCard.tsx
git commit -m "feat: add WordCard component with Web Speech API pronunciation"
```

---

### Task 18: Quiz Play Page

**Files:**
- Create: `src/pages/QuizPlayPage.tsx`

The quiz hook is initialized once words are loaded. A `QuizArea` inner component is used so `useQuiz` is only called after the word list is available (hooks cannot be called conditionally).

- [ ] **Step 1: Write `src/pages/QuizPlayPage.tsx`**

```typescript
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuiz } from '../hooks/useQuiz'
import { api } from '../lib/api'
import WordCard from '../components/WordCard'
import type { WordEntry } from '../types'

interface QuizAreaProps {
  words: WordEntry[]
  unit: string
  username: string
  sessionId: number
  startTime: number
}

function QuizArea({ words, unit, username, sessionId, startTime }: QuizAreaProps) {
  const navigate = useNavigate()
  const quiz = useQuiz(words)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const attemptCount = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!quiz.isComplete) return
    const duration_ms = Date.now() - startTime
    api.completeSession({ session_id: sessionId, student: username, unit, rounds: quiz.rounds, duration_ms })
      .then(() => navigate('/result', { state: { unit, rounds: quiz.rounds, duration_ms } }))
  }, [quiz.isComplete])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!quiz.current || feedback !== null) return

    const word = quiz.current.word
    attemptCount.current[word] = (attemptCount.current[word] ?? 0) + 1

    const { correct } = quiz.submit(input)
    setInput('')

    await api.recordWord({
      session_id: sessionId,
      student: username,
      unit,
      word,
      correct: correct ? 1 : 0,
      attempt_number: attemptCount.current[word],
    })

    if (!correct) {
      setFeedback(word)
      setTimeout(() => {
        setFeedback(null)
        inputRef.current?.focus()
      }, 1500)
    } else {
      inputRef.current?.focus()
    }
  }

  if (!quiz.current) return null

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
      <WordCard word={quiz.current} remaining={quiz.remaining} rounds={quiz.rounds} />

      {feedback && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 12,
          textAlign: 'center',
          color: '#b91c1c',
        }}>
          正确答案：<strong>{feedback}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="输入英文单词/词组"
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          disabled={feedback !== null}
          style={{ width: '100%', padding: '10px', fontSize: 18, marginBottom: 8 }}
        />
        <button
          type="submit"
          disabled={!input.trim() || feedback !== null}
          style={{ width: '100%', padding: '10px', fontSize: 16 }}
        >
          提交
        </button>
      </form>
    </div>
  )
}

export default function QuizPlayPage() {
  const { unit } = useParams<{ unit: string }>()
  const { username } = useAuth()
  const [words, setWords] = useState<WordEntry[] | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const startTime = useRef(Date.now())

  useEffect(() => {
    if (!unit || !username) return
    api.getWordList(`${unit}.json`).then(async data => {
      const { session_id } = await api.startSession({
        student: username,
        unit,
        mode: 'queue_cycle',
        total_words: data.words.length,
      })
      startTime.current = Date.now()
      setSessionId(session_id)
      setWords(data.words)
    })
  }, [unit, username])

  if (!words || sessionId === null) return <p style={{ padding: 16 }}>加载中…</p>

  return (
    <QuizArea
      words={words}
      unit={unit!}
      username={username!}
      sessionId={sessionId}
      startTime={startTime.current}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/QuizPlayPage.tsx
git commit -m "feat: add quiz play page"
```

---

### Task 19: Result Page

**Files:**
- Create: `src/pages/ResultPage.tsx`

- [ ] **Step 1: Write `src/pages/ResultPage.tsx`**

```typescript
import { useLocation, Link } from 'react-router-dom'

interface ResultState {
  unit: string
  rounds: number
  duration_ms: number
}

export default function ResultPage() {
  const { state } = useLocation()
  const { unit, rounds, duration_ms } = (state ?? {}) as Partial<ResultState>
  const minutes = Math.floor((duration_ms ?? 0) / 60000)
  const seconds = Math.floor(((duration_ms ?? 0) % 60000) / 1000)

  return (
    <div style={{ maxWidth: 400, margin: '10vh auto', padding: '0 16px', textAlign: 'center' }}>
      <h2>✅ 完成！</h2>
      {unit && <p>词库：{unit}</p>}
      {rounds !== undefined && <p>共循环 {rounds} 轮</p>}
      {duration_ms !== undefined && (
        <p>用时：{minutes > 0 ? `${minutes} 分 ` : ''}{seconds} 秒</p>
      )}
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {unit && (
          <Link to={`/quiz/${unit}`}>
            <button style={{ width: '100%', padding: '10px', fontSize: 16 }}>再来一次</button>
          </Link>
        )}
        <Link to="/home">
          <button style={{ width: '100%', padding: '10px', fontSize: 16 }}>选其他词库</button>
        </Link>
        <Link to="/stats">
          <button style={{ width: '100%', padding: '10px', fontSize: 16 }}>查看我的统计</button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ResultPage.tsx
git commit -m "feat: add result page"
```

---

### Task 20: Stats Page

**Files:**
- Create: `src/pages/StatsPage.tsx`

- [ ] **Step 1: Write `src/pages/StatsPage.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { StudentStats } from '../types'

export default function StatsPage() {
  const { username } = useAuth()
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!username) return
    api.getStats(username)
      .then(setStats)
      .finally(() => setLoading(false))
  }, [username])

  if (loading) return <p style={{ padding: 16 }}>加载中…</p>

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <Link to="/home">← 返回</Link>
      <h2>{username} 的学习统计</h2>

      <h3>最近会话</h3>
      {!stats?.sessions.length && <p>还没有完成的测验记录</p>}
      <div style={{ display: 'grid', gap: 8 }}>
        {stats?.sessions.map(s => {
          const date = new Date(s.started_at).toLocaleDateString('zh-CN')
          const min = s.duration_ms !== null ? Math.floor(s.duration_ms / 60000) : null
          const sec = s.duration_ms !== null ? Math.floor((s.duration_ms % 60000) / 1000) : null
          return (
            <div key={s.session_id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
              <strong>{s.unit}</strong>
              <span style={{ float: 'right', color: '#888' }}>{date}</span>
              {s.finished_at ? (
                <p style={{ margin: '4px 0 0', color: '#555' }}>
                  {s.rounds} 轮 · {min !== null && min > 0 ? `${min}分` : ''}{sec}秒
                </p>
              ) : (
                <p style={{ margin: '4px 0 0', color: '#aaa' }}>未完成</p>
              )}
            </div>
          )
        })}
      </div>

      {!!stats?.high_error_words.length && (
        <>
          <h3>重点复习词</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>单词</th>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>词库</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>尝试次数</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>正确率</th>
              </tr>
            </thead>
            <tbody>
              {stats.high_error_words.map(w => (
                <tr key={`${w.unit}-${w.word}`} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '4px 8px' }}><strong>{w.word}</strong></td>
                  <td style={{ padding: '4px 8px', color: '#888' }}>{w.unit}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{w.total_attempts}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                    {Math.round((w.correct_count / w.total_attempts) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/StatsPage.tsx
git commit -m "feat: add stats page"
```

---

### Task 21: Update CLAUDE.md and Smoke Test

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Replace `CLAUDE.md` content**

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Local development (full stack):**
```bash
npx wrangler pages dev -- npm run dev
```
Runs Vite (port 5173) proxied by Wrangler (port 8788). Always open `http://localhost:8788` in the browser — not 5173 — so API calls route through the Functions runtime.

**Run tests:**
```bash
npm run test:run
```

**Build:**
```bash
npm run build
```

**Apply D1 migration locally (run once after first clone):**
```bash
npx wrangler d1 execute wordmaster-db --local --file=migrations/0001_init.sql
```

## Architecture

Full design: `docs/superpowers/specs/2026-06-07-wordmaster-design.md`

- **Frontend:** `src/` — React + Vite. One file per route in `src/pages/`, shared UI in `src/components/`, quiz state machine in `src/hooks/useQuiz.ts`, API wrappers in `src/lib/api.ts`.
- **API:** `functions/api/` — Cloudflare Pages Functions, auto-routed to `/api/*`. Each file handles one endpoint. All functions receive D1 via `context.env.DB`. Use triple-slash `/// <reference types="@cloudflare/workers-types" />` at top of each function file.
- **Word lists:** `public/wordlists/` — static JSON assets served by Pages. `index.json` is the manifest; one `.json` file per unit. Fetched directly by the browser with no Worker involvement.
- **Database:** `wordmaster-db` D1 database. Schema in `migrations/0001_init.sql`. Two tables: `students` (login) and `quiz_events` (event log for all quiz activity).

## Deployment

1. Push to GitHub → CF Pages auto-builds (`npm run build`, output: `dist`)
2. D1 binding: create database in CF console → bind as `DB` in Pages project settings → update `database_id` in `wrangler.toml`
3. Apply `migrations/0001_init.sql` once via CF console D1 SQL editor

## Adding Word Lists

Add a new JSON file to `public/wordlists/` following the schema in `docs/superpowers/specs/2026-06-07-wordmaster-design.md` §3, then add an entry to `public/wordlists/index.json`. Push to GitHub — no build step required.
```

- [ ] **Step 2: Full smoke test**

Start the full stack:

```bash
npx wrangler pages dev -- npm run dev
```

Open `http://localhost:8788` and verify this flow end-to-end:

1. Login page appears → enter a username → redirected to `/home`
2. Home page shows "Unit 1" card with description and word count
3. Click Unit 1 → quiz config page shows title and mode description
4. Click "开始测验" → quiz play page shows a Chinese meaning and 🔊 button
5. Click 🔊 → browser speaks the English word
6. Type an incorrect answer → red feedback bar shows correct answer for 1.5s, then clears
7. Type the correct answer → advances to next word; counter shows remaining count
8. Complete all words → result page shows rounds and duration
9. Click "查看我的统计" → stats page shows the completed session

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with dev commands and architecture"
```

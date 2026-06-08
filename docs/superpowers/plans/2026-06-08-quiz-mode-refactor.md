# Quiz Mode Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the quiz flow (mode-first, then word list) and add an error-words review mode that tests words from the student's high-error statistics.

**Architecture:** `HomePage` becomes a two-card mode selector. Word list selection moves to a new `WordListPage`. A new `ErrorPreviewPage` fetches stats, groups errors by unit, then assembles `WordEntry[]` before navigating to `QuizPlayPage` via router state. `QuizPlayPage` detects errors mode from `location.state` and records each word under its original unit. `QuizConfigPage` is deleted (it was a pass-through with no real choice).

**Tech Stack:** React 19, React Router v6, TypeScript, Tailwind CSS v4, Cloudflare Pages Functions, Vitest

---

## File Structure

| Action | File |
|---|---|
| Modify | `src/types.ts` |
| Create | `src/pages/WordListPage.tsx` |
| Modify | `src/pages/HomePage.tsx` |
| Create | `src/pages/ErrorPreviewPage.tsx` |
| Modify | `src/pages/QuizPlayPage.tsx` |
| Modify | `src/pages/ResultPage.tsx` |
| Modify | `src/App.tsx` |
| Delete | `src/pages/QuizConfigPage.tsx` |

---

### Task 1: Add `unit?` to `WordEntry`

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Edit `src/types.ts`**

Replace the `WordEntry` interface:

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

The rest of the file is unchanged.

- [ ] **Step 2: Run tests**

```bash
npm run test:run
```

Expected: `8 passed (8)`

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add optional unit field to WordEntry for errors mode"
```

---

### Task 2: Create WordListPage

**Files:**
- Create: `src/pages/WordListPage.tsx`

This is the word list picker. It replaces the word-list content from `HomePage`. Clicking a word list navigates directly to play (no intermediate `QuizConfigPage`).

- [ ] **Step 1: Create `src/pages/WordListPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { WordListIndex } from '../types'

export default function WordListPage() {
  const [lists, setLists] = useState<WordListIndex[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getWordListIndex()
      .then(setLists)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/home" className="text-sm text-indigo-600 hover:text-indigo-700">← 返回</Link>
      <h2 className="text-lg font-semibold text-gray-900 mt-4 mb-3">选择词库</h2>
      {loading && <p className="text-gray-500">加载中…</p>}
      <div className="flex flex-col gap-3">
        {lists.map(item => (
          <Link
            key={item.file}
            to={`/quiz/words/${item.file.replace('.json', '')}/play`}
            className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-900 no-underline"
          >
            <div className="flex justify-between items-start">
              <strong className="font-semibold">{item.title}</strong>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.total} 词</span>
            </div>
            <p className="text-sm text-gray-500 mt-1 mb-0">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
npm run test:run
```

Expected: `8 passed (8)`

- [ ] **Step 3: Commit**

```bash
git add src/pages/WordListPage.tsx
git commit -m "feat: add WordListPage (word list picker)"
```

---

### Task 3: Replace HomePage with mode selector

**Files:**
- Modify: `src/pages/HomePage.tsx`

`HomePage` becomes the mode selector. The word list content has moved to `WordListPage`.

- [ ] **Step 1: Replace entire `src/pages/HomePage.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">WordMaster</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">👤 {username}</span>
          <Link to="/stats" className="text-indigo-600 hover:text-indigo-700 font-medium">我的统计</Link>
          <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">退出</button>
        </div>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">选择模式</h2>
      <div className="flex flex-col gap-3">
        <Link
          to="/quiz/words"
          className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-900 no-underline"
        >
          <strong className="font-semibold">词库练习</strong>
          <p className="text-sm text-gray-500 mt-1 mb-0">从词库中选词，循环测验直到全部答对</p>
        </Link>
        <Link
          to="/quiz/errors"
          className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-900 no-underline"
        >
          <strong className="font-semibold">错词复习</strong>
          <p className="text-sm text-gray-500 mt-1 mb-0">重新测试统计中的高频错词</p>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
npm run test:run
```

Expected: `8 passed (8)`

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat: replace HomePage with mode selector"
```

---

### Task 4: Create ErrorPreviewPage

**Files:**
- Create: `src/pages/ErrorPreviewPage.tsx`

Fetches stats and word list index in parallel. Groups error words by unit (showing human-readable titles). On "开始复习": loads each unit's word list JSON, assembles `WordEntry[]` with `unit` field attached, navigates to `/quiz/errors/play` via router state.

- [ ] **Step 1: Create `src/pages/ErrorPreviewPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { WordEntry, WordErrorStat } from '../types'

export default function ErrorPreviewPage() {
  const { username } = useAuth()
  const navigate = useNavigate()
  const [errorWords, setErrorWords] = useState<WordErrorStat[] | null>(null)
  const [unitTitles, setUnitTitles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!username) return
    Promise.all([api.getStats(username), api.getWordListIndex()])
      .then(([stats, index]) => {
        setErrorWords(stats.high_error_words)
        const titles: Record<string, string> = {}
        index.forEach(item => { titles[item.file.replace('.json', '')] = item.title })
        setUnitTitles(titles)
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [username])

  const handleStart = async () => {
    if (!errorWords?.length) return
    setStarting(true)
    try {
      const units = [...new Set(errorWords.map(w => w.unit))]
      const wordLists = await Promise.all(units.map(u => api.getWordList(`${u}.json`)))
      const lookup: Record<string, Record<string, WordEntry>> = {}
      units.forEach((u, i) => {
        lookup[u] = {}
        wordLists[i].words.forEach(w => { lookup[u][w.word] = w })
      })
      const words: WordEntry[] = errorWords.flatMap(ew => {
        const entry = lookup[ew.unit]?.[ew.word]
        return entry ? [{ ...entry, unit: ew.unit }] : []
      })
      navigate('/quiz/errors/play', { state: { words } })
    } catch {
      setLoadError(true)
    } finally {
      setStarting(false)
    }
  }

  if (loading) return <p className="p-4 text-gray-500">加载中…</p>

  return (
    <div className="max-w-sm mx-auto px-4 pt-[10vh]">
      <Link to="/home" className="text-sm text-indigo-600 hover:text-indigo-700">← 返回</Link>
      <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-6">错词复习</h2>

      {loadError && (
        <p className="text-red-600 text-sm mb-4">加载失败，请返回重试</p>
      )}

      {!loadError && errorWords?.length === 0 && (
        <p className="text-gray-500 text-sm">暂无错词记录，完成几次测验后这里会显示需要加强的词</p>
      )}

      {!loadError && !!errorWords?.length && (
        <>
          <div className="flex flex-col gap-2 mb-4">
            {Object.entries(
              errorWords.reduce<Record<string, number>>((acc, w) => {
                acc[w.unit] = (acc[w.unit] ?? 0) + 1
                return acc
              }, {})
            ).map(([unit, count]) => (
              <div key={unit} className="flex justify-between items-center bg-white border border-gray-200 rounded-xl px-4 py-3">
                <span className="text-gray-900 font-medium">{unitTitles[unit] ?? unit}</span>
                <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{count} 词</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 mb-6 text-center">共 {errorWords.length} 个错词</p>
          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full py-2.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {starting ? '加载中…' : '开始复习'}
          </button>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
npm run test:run
```

Expected: `8 passed (8)`

- [ ] **Step 3: Commit**

```bash
git add src/pages/ErrorPreviewPage.tsx
git commit -m "feat: add ErrorPreviewPage for error words review"
```

---

### Task 5: Update QuizPlayPage to support errors mode

**Files:**
- Modify: `src/pages/QuizPlayPage.tsx`

Two changes:
1. `QuizPlayPage` detects errors mode from `location.state.words`. If present, skips word list fetch and uses pre-assembled words; uses `unit: 'errors'` for session. If `location.state.words` is missing at `/quiz/errors/play` (e.g. direct URL visit), redirects to `/quiz/errors`.
2. `handleSubmit` in `QuizArea` uses `quiz.current.unit ?? unit` for `recordWord`, so each error word records under its original unit.

- [ ] **Step 1: Replace entire `src/pages/QuizPlayPage.tsx`**

```tsx
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
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
  onRestart: () => void
}

function QuizArea({ words, unit, username, sessionId, startTime, onRestart }: QuizAreaProps) {
  const navigate = useNavigate()
  const quiz = useQuiz(words)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [paused, setPaused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const attemptCount = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!quiz.isComplete) return
    const duration_ms = Date.now() - startTime
    api.completeSession({ session_id: sessionId, student: username, unit, rounds: quiz.rounds, duration_ms })
      .finally(() => navigate('/result', { state: { unit, rounds: quiz.rounds, duration_ms } }))
  }, [quiz.isComplete])

  useEffect(() => {
    if (!quiz.current || paused) return
    const utterance = new SpeechSynthesisUtterance(quiz.current.word)
    utterance.lang = 'en-US'
    speechSynthesis.cancel()
    speechSynthesis.speak(utterance)
  }, [quiz.current?.word, paused])

  useEffect(() => {
    if (feedback === null && !paused) inputRef.current?.focus()
  }, [feedback, paused])

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
      unit: quiz.current.unit ?? unit,
      word,
      correct: correct ? 1 : 0,
      attempt_number: attemptCount.current[word],
    })

    if (!correct) {
      setFeedback(word)
      setTimeout(() => setFeedback(null), 3000)
    } else {
      inputRef.current?.focus()
    }
  }

  if (!quiz.current) return null

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setPaused(true)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
        >
          <span>⏸</span>
          暂停
        </button>
      </div>

      <WordCard word={quiz.current} remaining={quiz.remaining} rounds={quiz.rounds} />

      {feedback && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-center text-red-700">
          正确答案：<strong>{feedback}</strong>
        </div>
      )}

      {paused ? (
        <div className="text-center py-8 space-y-3">
          <p className="text-gray-500 mb-4">已暂停</p>
          <button
            onClick={() => setPaused(false)}
            className="w-full py-2.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            继续
          </button>
          <button
            onClick={onRestart}
            className="w-full py-2.5 text-base font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
          >
            重来
          </button>
          <button
            onClick={() => navigate('/home')}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            退出测验
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
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
            className="w-full px-3 py-3 text-lg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || feedback !== null}
            className="w-full py-3 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            提交
          </button>
        </form>
      )}
    </div>
  )
}

export default function QuizPlayPage() {
  const { unit: unitParam } = useParams<{ unit: string }>()
  const location = useLocation()
  const { username } = useAuth()
  const navigate = useNavigate()
  const [words, setWords] = useState<WordEntry[] | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [sessionKey, setSessionKey] = useState(0)
  const startTime = useRef(0)

  useEffect(() => {
    if (!username) return
    setWords(null)
    setSessionId(null)

    const stateWords: WordEntry[] | undefined = location.state?.words

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
      return
    }

    if (!unitParam) return
    api.getWordList(`${unitParam}.json`).then(async data => {
      const { session_id } = await api.startSession({
        student: username,
        unit: unitParam,
        mode: 'queue_cycle',
        total_words: data.words.length,
      })
      startTime.current = Date.now()
      setSessionId(session_id)
      setWords(data.words)
    })
  }, [unitParam, username, sessionKey, location.state])

  const unit = location.state?.words ? 'errors' : (unitParam ?? '')

  if (!words || sessionId === null) return <p className="p-4 text-gray-500">加载中…</p>

  return (
    <QuizArea
      key={sessionKey}
      words={words}
      unit={unit}
      username={username!}
      sessionId={sessionId}
      startTime={startTime.current}
      onRestart={() => setSessionKey(k => k + 1)}
    />
  )
}
```

- [ ] **Step 2: Run tests**

```bash
npm run test:run
```

Expected: `8 passed (8)`

- [ ] **Step 3: Commit**

```bash
git add src/pages/QuizPlayPage.tsx
git commit -m "feat: QuizPlayPage supports errors mode via location.state"
```

---

### Task 6: Wire routes — update App.tsx, fix ResultPage, delete QuizConfigPage

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/ResultPage.tsx`
- Delete: `src/pages/QuizConfigPage.tsx`

`ResultPage` currently links "再来一次" to `/quiz/:unit` (old `QuizConfigPage` route, being deleted). Fix it: for normal mode link to `/quiz/words/:unit/play`, for errors mode link to `/quiz/errors`. Also update the "选其他词库" button text to "返回首页" since `/home` is now the mode selector.

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import WordListPage from './pages/WordListPage'
import ErrorPreviewPage from './pages/ErrorPreviewPage'
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

- [ ] **Step 2: Replace `src/pages/ResultPage.tsx`**

```tsx
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
  const replayLink = unit === 'errors' ? '/quiz/errors' : `/quiz/words/${unit}/play`
  const replayLabel = unit === 'errors' ? '再次复习错词' : '再来一次'

  return (
    <div className="max-w-sm mx-auto px-4 pt-[10vh] text-center">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">完成！</h2>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8 text-left space-y-2">
        {unit && unit !== 'errors' && <p className="text-gray-600 m-0">词库：<span className="font-medium text-gray-900">{unit}</span></p>}
        {unit === 'errors' && <p className="text-gray-600 m-0">模式：<span className="font-medium text-gray-900">错词复习</span></p>}
        {rounds !== undefined && <p className="text-gray-600 m-0">共循环：<span className="font-medium text-gray-900">{rounds} 轮</span></p>}
        {duration_ms !== undefined && (
          <p className="text-gray-600 m-0">用时：<span className="font-medium text-gray-900">{minutes > 0 ? `${minutes} 分 ` : ''}{seconds} 秒</span></p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {unit && (
          <Link to={replayLink} className="block w-full py-2.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors no-underline">
            {replayLabel}
          </Link>
        )}
        <Link to="/home" className="block w-full py-2.5 text-base font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors no-underline">
          返回首页
        </Link>
        <Link to="/stats" className="block w-full py-2.5 text-base font-medium text-indigo-600 hover:text-indigo-700 rounded-lg transition-colors no-underline">
          查看我的统计
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Delete `src/pages/QuizConfigPage.tsx`**

```bash
rm src/pages/QuizConfigPage.tsx
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run
```

Expected: `8 passed (8)`

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/pages/ResultPage.tsx
git rm src/pages/QuizConfigPage.tsx
git commit -m "feat: wire quiz mode refactor — new routes, fix ResultPage, remove QuizConfigPage"
```

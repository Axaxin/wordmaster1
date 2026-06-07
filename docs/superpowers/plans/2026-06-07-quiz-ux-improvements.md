# Quiz UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Five UX improvements: 3s feedback, auto-play pronunciation, pause/resume/restart controls, focus fix after wrong answer, and a clear-stats button.

**Architecture:** All quiz changes are in `QuizArea` inside `src/pages/QuizPlayPage.tsx`. Clear stats adds one new Cloudflare Pages Function (`functions/api/student/[username]/clear-stats.ts`), one method in `src/lib/api.ts`, and a button in `src/pages/StatsPage.tsx`.

**Tech Stack:** React 19, Cloudflare Pages Functions, D1, Tailwind CSS v4, Vitest

---

## File Structure

| Action | File |
|---|---|
| Modify | `src/pages/QuizPlayPage.tsx` |
| Create | `functions/api/student/[username]/clear-stats.ts` |
| Modify | `src/lib/api.ts` |
| Modify | `src/pages/StatsPage.tsx` |

---

### Task 1: QuizPlayPage UX improvements

Four changes in one file: feedback duration, auto-play, focus fix, pause controls.

**Files:**
- Modify: `src/pages/QuizPlayPage.tsx`

- [ ] **Step 1: Replace the entire `QuizArea` function** (keep `QuizPlayPage` unchanged)

The new `QuizArea` adds:
- `paused` state
- `useEffect` for auto-play (watches `quiz.current?.word`)
- `useEffect` for focus fix (watches `feedback`)
- Pause button above `WordCard`
- Paused overlay with 继续 / 重来
- Timeout changed from 1500 → 3000
- `setFeedback(null)` separated from focus (focus handled by useEffect)

Replace only the `QuizArea` function — everything from `function QuizArea` through its closing `}` — with:

```tsx
function QuizArea({ words, unit, username, sessionId, startTime }: QuizAreaProps) {
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
  }, [quiz.current?.word])

  useEffect(() => {
    if (feedback === null && !paused) inputRef.current?.focus()
  }, [feedback])

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
          className="text-sm text-gray-400 hover:text-gray-600 px-2 py-1"
        >
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
            onClick={() => navigate(`/quiz/${unit}/play`, { replace: true })}
            className="w-full py-2.5 text-base font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
          >
            重来
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
```

- [ ] **Step 2: Run tests**

```bash
npm run test:run
```

Expected: `8 passed (8)`

- [ ] **Step 3: Commit**

```bash
git add src/pages/QuizPlayPage.tsx
git commit -m "feat: quiz UX — auto-play, 3s feedback, focus fix, pause/resume/restart"
```

---

### Task 2: Clear stats API endpoint

**Files:**
- Create: `functions/api/student/[username]/clear-stats.ts`

- [ ] **Step 1: Create the new function file**

```ts
/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database
}

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  const username = Array.isArray(params.username) ? params.username[0] : params.username
  if (!username) {
    return Response.json({ error: 'username required' }, { status: 400 })
  }

  await env.DB.prepare('DELETE FROM quiz_events WHERE student = ?').bind(username).run()

  return Response.json({ ok: true })
}
```

- [ ] **Step 2: Run tests**

```bash
npm run test:run
```

Expected: `8 passed (8)`

- [ ] **Step 3: Commit**

```bash
git add "functions/api/student/[username]/clear-stats.ts"
git commit -m "feat: add DELETE /api/student/:username/clear-stats endpoint"
```

---

### Task 3: Clear stats frontend

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/pages/StatsPage.tsx`

- [ ] **Step 1: Add `del` helper and `clearStats` method to `src/lib/api.ts`**

Add the `del` helper after the existing `get` function (before the `export const api` block):

```ts
async function del<T>(path: string): Promise<T> {
  const res = await fetch(path, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`)
  return res.json()
}
```

Add `clearStats` as the last entry in the `api` object:

```ts
  clearStats: (username: string) =>
    del<{ ok: boolean }>(`/api/student/${encodeURIComponent(username)}/clear-stats`),
```

The full updated `src/lib/api.ts`:

```ts
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

async function del<T>(path: string): Promise<T> {
  const res = await fetch(path, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`)
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

  clearStats: (username: string) =>
    del<{ ok: boolean }>(`/api/student/${encodeURIComponent(username)}/clear-stats`),
}
```

- [ ] **Step 2: Update `src/pages/StatsPage.tsx`**

Add `handleClearStats` function and clear button. Replace the entire file:

```tsx
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

  const handleClearStats = async () => {
    if (!window.confirm('确认清空所有记录？此操作不可恢复。')) return
    await api.clearStats(username!)
    setStats({ sessions: [], high_error_words: [] })
  }

  if (loading) return <p className="p-4 text-gray-500">加载中…</p>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/home" className="text-sm text-indigo-600 hover:text-indigo-700">← 返回</Link>
      <div className="flex justify-between items-center mt-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">{username} 的学习统计</h2>
        <button
          onClick={handleClearStats}
          className="text-sm text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors"
        >
          清空记录
        </button>
      </div>

      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">最近会话</h3>
      {!stats?.sessions.length && <p className="text-gray-500 text-sm">还没有完成的测验记录</p>}
      <div className="flex flex-col gap-2 mb-8">
        {stats?.sessions.map(s => {
          const date = new Date(s.started_at).toLocaleDateString('zh-CN')
          const min = s.duration_ms !== null ? Math.floor(s.duration_ms / 60000) : null
          const sec = s.duration_ms !== null ? Math.floor((s.duration_ms % 60000) / 1000) : null
          return (
            <div key={s.session_id} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex justify-between items-center">
                <strong className="font-semibold text-gray-900">{s.unit}</strong>
                <span className="text-sm text-gray-400">{date}</span>
              </div>
              {s.finished_at ? (
                <p className="text-sm text-gray-500 mt-1 mb-0">
                  {s.rounds} 轮 · {min !== null && min > 0 ? `${min}分` : ''}{sec}秒
                </p>
              ) : (
                <span className="inline-block mt-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">未完成</span>
              )}
            </div>
          )
        })}
      </div>

      {!!stats?.high_error_words.length && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">重点复习词</h3>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">单词</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">词库</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">尝试</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">正确率</th>
                </tr>
              </thead>
              <tbody>
                {stats.high_error_words.map((w, i) => {
                  const rate = Math.round((w.correct_count / w.total_attempts) * 100)
                  const rateColor = rate >= 80 ? 'text-green-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600'
                  return (
                    <tr key={`${w.unit}-${w.word}`} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-3 font-medium text-gray-900">{w.word}</td>
                      <td className="px-4 py-3 text-gray-500">{w.unit}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{w.total_attempts}</td>
                      <td className={`px-4 py-3 text-right font-medium ${rateColor}`}>{rate}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run tests**

```bash
npm run test:run
```

Expected: `8 passed (8)`

- [ ] **Step 4: Commit**

```bash
git add src/lib/api.ts src/pages/StatsPage.tsx
git commit -m "feat: add clear stats button with confirmation"
```

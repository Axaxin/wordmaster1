# Tailwind UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install Tailwind CSS v4 and replace all inline styles with Tailwind classes across every page and component.

**Architecture:** Tailwind v4 is installed via the official `@tailwindcss/vite` Vite plugin — no config file needed. A single `@import "tailwindcss"` in `src/index.css` activates the framework. All inline `style={{...}}` props are removed and replaced with `className` strings using the token set from the spec.

**Tech Stack:** Tailwind CSS v4, `@tailwindcss/vite`, React 19, Vite 8

---

## File Structure

| Action | File |
|---|---|
| Modify | `package.json` (add deps) |
| Modify | `vite.config.ts` (add tailwind plugin) |
| Replace | `src/index.css` (add `@import "tailwindcss"`) |
| Clear | `src/App.css` (remove Vite scaffold, not imported anywhere) |
| Modify | `src/pages/LoginPage.tsx` |
| Modify | `src/pages/HomePage.tsx` |
| Modify | `src/pages/QuizConfigPage.tsx` |
| Modify | `src/components/WordCard.tsx` |
| Modify | `src/pages/QuizPlayPage.tsx` |
| Modify | `src/pages/ResultPage.tsx` |
| Modify | `src/pages/StatsPage.tsx` |

---

### Task 1: Install and configure Tailwind CSS v4

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Replace: `src/index.css`
- Clear: `src/App.css`

- [ ] **Step 1: Install packages**

```bash
npm install tailwindcss @tailwindcss/vite
```

Expected: packages added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Add Tailwind plugin to vite.config.ts**

Replace the entire file:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 3: Replace src/index.css**

Replace the entire file with:

```css
@import "tailwindcss";
```

- [ ] **Step 4: Clear src/App.css**

Replace the entire file with an empty string (file is not imported anywhere — just clearing Vite scaffold):

```css
```

- [ ] **Step 5: Run tests to verify nothing broke**

```bash
npm run test:run
```

Expected: `8 passed (8)` — all logic tests still pass.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/index.css src/App.css
git commit -m "feat: install and configure Tailwind CSS v4"
```

---

### Task 2: Restyle LoginPage

**Files:**
- Modify: `src/pages/LoginPage.tsx`

- [ ] **Step 1: Replace file content**

```tsx
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
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-[20vh] px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">WordMaster</h1>
        <p className="text-gray-500 mb-6">输入你的账号名开始学习</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="账号名"
            autoFocus
            className="w-full px-3 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-full py-2.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '登录中…' : '开始'}
          </button>
        </form>
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
git add src/pages/LoginPage.tsx
git commit -m "style: restyle LoginPage with Tailwind"
```

---

### Task 3: Restyle HomePage

**Files:**
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: Replace file content**

```tsx
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
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">WordMaster</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">👤 {username}</span>
          <Link to="/stats" className="text-indigo-600 hover:text-indigo-700 font-medium">我的统计</Link>
          <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">退出</button>
        </div>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">选择词库</h2>
      {loading && <p className="text-gray-500">加载中…</p>}
      <div className="flex flex-col gap-3">
        {lists.map(item => (
          <Link
            key={item.file}
            to={`/quiz/${item.file.replace('.json', '')}`}
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

- [ ] **Step 2: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "style: restyle HomePage with Tailwind"
```

---

### Task 4: Restyle QuizConfigPage

**Files:**
- Modify: `src/pages/QuizConfigPage.tsx`

- [ ] **Step 1: Replace file content**

```tsx
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

  if (loading) return <p className="p-4 text-gray-500">加载中…</p>
  if (!meta) return <p className="p-4 text-gray-500">词库不存在</p>

  return (
    <div className="max-w-sm mx-auto px-4 pt-[10vh]">
      <Link to="/home" className="text-sm text-indigo-600 hover:text-indigo-700">← 返回</Link>
      <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-1">{meta.title}</h2>
      <p className="text-gray-500 mb-1">{meta.description}</p>
      <p className="text-sm text-gray-400 mb-6">共 {meta.total} 个词</p>
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">选择模式</h3>
      <div className="border-2 border-indigo-600 bg-indigo-50 rounded-xl p-4 mb-6">
        <strong className="text-gray-900 font-semibold">循环队列模式</strong>
        <p className="text-sm text-gray-500 mt-1 mb-0">答错放回队尾，全部答对才完成</p>
      </div>
      <button
        onClick={() => navigate(`/quiz/${unit}/play`)}
        className="w-full py-2.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
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
git commit -m "style: restyle QuizConfigPage with Tailwind"
```

---

### Task 5: Restyle WordCard

**Files:**
- Modify: `src/components/WordCard.tsx`

- [ ] **Step 1: Replace file content**

```tsx
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
    <div className="text-center py-8">
      <div className="flex justify-center items-center gap-2 mb-6 text-sm">
        <span className="text-gray-500">剩余 {remaining} 词</span>
        <span className="bg-indigo-100 text-indigo-700 rounded-full px-2.5 py-0.5 font-medium">第 {rounds} 轮</span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-3">{word.meaning}</div>
      {word.note && (
        <div className="text-sm text-gray-500 mb-4">{word.note}</div>
      )}
      <button
        onClick={speak}
        className="rounded-full bg-indigo-100 hover:bg-indigo-200 p-2.5 text-indigo-700 transition-colors"
        title="朗读单词"
      >
        🔊
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/WordCard.tsx
git commit -m "style: restyle WordCard with Tailwind"
```

---

### Task 6: Restyle QuizPlayPage

**Files:**
- Modify: `src/pages/QuizPlayPage.tsx`

- [ ] **Step 1: Replace file content**

```tsx
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
      .finally(() => navigate('/result', { state: { unit, rounds: quiz.rounds, duration_ms } }))
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
    <div className="max-w-lg mx-auto px-4 py-6">
      <WordCard word={quiz.current} remaining={quiz.remaining} rounds={quiz.rounds} />

      {feedback && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-center text-red-700">
          正确答案：<strong>{feedback}</strong>
        </div>
      )}

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
    </div>
  )
}

export default function QuizPlayPage() {
  const { unit } = useParams<{ unit: string }>()
  const { username } = useAuth()
  const [words, setWords] = useState<WordEntry[] | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const startTime = useRef(0)

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

  if (!words || sessionId === null) return <p className="p-4 text-gray-500">加载中…</p>

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

- [ ] **Step 2: Run tests**

```bash
npm run test:run
```

Expected: `8 passed (8)`

- [ ] **Step 3: Commit**

```bash
git add src/pages/QuizPlayPage.tsx
git commit -m "style: restyle QuizPlayPage with Tailwind"
```

---

### Task 7: Restyle ResultPage

**Files:**
- Modify: `src/pages/ResultPage.tsx`

- [ ] **Step 1: Replace file content**

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

  return (
    <div className="max-w-sm mx-auto px-4 pt-[10vh] text-center">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">完成！</h2>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8 text-left space-y-2">
        {unit && <p className="text-gray-600 m-0">词库：<span className="font-medium text-gray-900">{unit}</span></p>}
        {rounds !== undefined && <p className="text-gray-600 m-0">共循环：<span className="font-medium text-gray-900">{rounds} 轮</span></p>}
        {duration_ms !== undefined && (
          <p className="text-gray-600 m-0">用时：<span className="font-medium text-gray-900">{minutes > 0 ? `${minutes} 分 ` : ''}{seconds} 秒</span></p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {unit && (
          <Link to={`/quiz/${unit}`} className="block w-full py-2.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors no-underline">
            再来一次
          </Link>
        )}
        <Link to="/home" className="block w-full py-2.5 text-base font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors no-underline">
          选其他词库
        </Link>
        <Link to="/stats" className="block w-full py-2.5 text-base font-medium text-indigo-600 hover:text-indigo-700 rounded-lg transition-colors no-underline">
          查看我的统计
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ResultPage.tsx
git commit -m "style: restyle ResultPage with Tailwind"
```

---

### Task 8: Restyle StatsPage

**Files:**
- Modify: `src/pages/StatsPage.tsx`

- [ ] **Step 1: Replace file content**

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

  if (loading) return <p className="p-4 text-gray-500">加载中…</p>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/home" className="text-sm text-indigo-600 hover:text-indigo-700">← 返回</Link>
      <h2 className="text-xl font-bold text-gray-900 mt-4 mb-6">{username} 的学习统计</h2>

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

- [ ] **Step 2: Run full test suite**

```bash
npm run test:run
```

Expected: `8 passed (8)`

- [ ] **Step 3: Commit**

```bash
git add src/pages/StatsPage.tsx
git commit -m "style: restyle StatsPage with Tailwind"
```

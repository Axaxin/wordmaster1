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

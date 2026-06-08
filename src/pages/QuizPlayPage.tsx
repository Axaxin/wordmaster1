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
  const { unit } = useParams<{ unit: string }>()
  const { username } = useAuth()
  const [words, setWords] = useState<WordEntry[] | null>(null)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [sessionKey, setSessionKey] = useState(0)
  const startTime = useRef(0)

  useEffect(() => {
    if (!unit || !username) return
    setWords(null)
    setSessionId(null)
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
  }, [unit, username, sessionKey])

  if (!words || sessionId === null) return <p className="p-4 text-gray-500">加载中…</p>

  return (
    <QuizArea
      key={sessionKey}
      words={words}
      unit={unit!}
      username={username!}
      sessionId={sessionId}
      startTime={startTime.current}
      onRestart={() => setSessionKey(k => k + 1)}
    />
  )
}

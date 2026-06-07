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

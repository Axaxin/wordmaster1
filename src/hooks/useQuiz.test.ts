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

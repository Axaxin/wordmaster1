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

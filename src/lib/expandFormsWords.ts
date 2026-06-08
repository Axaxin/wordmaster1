import type { WordEntry } from '../types'

export function expandFormsWords(words: WordEntry[]): WordEntry[] {
  const expanded: WordEntry[] = []
  for (const w of words) {
    expanded.push({ word: w.word, meaning: w.meaning, note: w.note })
    if (w.comparative) {
      expanded.push({ word: w.comparative, meaning: `${w.word} ${w.meaning}`, note: '比较级' })
    }
    if (w.superlative) {
      expanded.push({ word: w.superlative, meaning: `${w.word} ${w.meaning}`, note: '最高级' })
    }
  }
  return expanded
}

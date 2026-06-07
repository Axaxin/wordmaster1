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

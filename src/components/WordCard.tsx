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

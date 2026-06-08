import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { WordListIndex } from '../types'

export default function VerbListPage() {
  const navigate = useNavigate()
  const [lists, setLists] = useState<WordListIndex[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    api.getWordListIndex()
      .then(all => setLists(all.filter(item => item.hasIrregVerbs)))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  const handleStart = async (file: string) => {
    setStarting(file)
    try {
      const wordList = await api.getWordList(file)
      navigate('/quiz/verbs/play', { state: { words: wordList.words, unit: 'verbs' } })
    } catch {
      setLoadError(true)
      setStarting(null)
    }
  }

  if (loading) return <p className="p-4 text-gray-500">加载中…</p>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/home" className="text-sm text-indigo-600 hover:text-indigo-700">← 返回</Link>
      <h2 className="text-lg font-semibold text-gray-900 mt-4 mb-3">选择词库</h2>
      {loadError && <p className="text-red-600 text-sm mb-4">加载失败，请返回重试</p>}
      <div className="flex flex-col gap-3">
        {lists.map(item => (
          <button
            key={item.file}
            onClick={() => handleStart(item.file)}
            disabled={starting !== null}
            className="text-left p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            <div className="flex justify-between items-start">
              <strong className="font-semibold text-gray-900">{item.title}</strong>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-2 shrink-0">
                {starting === item.file ? '加载中…' : `${item.total} 词`}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 mb-0">{item.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

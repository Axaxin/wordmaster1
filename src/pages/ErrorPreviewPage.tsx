import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { WordEntry, WordErrorStat } from '../types'

export default function ErrorPreviewPage() {
  const { username } = useAuth()
  const navigate = useNavigate()
  const [errorWords, setErrorWords] = useState<WordErrorStat[] | null>(null)
  const [unitTitles, setUnitTitles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!username) return
    Promise.all([api.getStats(username), api.getWordListIndex()])
      .then(([stats, index]) => {
        setErrorWords(stats.high_error_words)
        const titles: Record<string, string> = {}
        index.forEach(item => { titles[item.file.replace('.json', '')] = item.title })
        setUnitTitles(titles)
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [username])

  const handleStart = async () => {
    if (!errorWords?.length) return
    setStarting(true)
    try {
      const units = [...new Set(errorWords.map(w => w.unit))]
      const wordLists = await Promise.all(units.map(u => api.getWordList(`${u}.json`)))
      const lookup: Record<string, Record<string, WordEntry>> = {}
      units.forEach((u, i) => {
        lookup[u] = {}
        wordLists[i].words.forEach(w => { lookup[u][w.word] = w })
      })
      const words: WordEntry[] = errorWords.flatMap(ew => {
        const entry = lookup[ew.unit]?.[ew.word]
        return entry ? [{ ...entry, unit: ew.unit }] : []
      })
      navigate('/quiz/errors/play', { state: { words } })
    } catch {
      setLoadError(true)
    } finally {
      setStarting(false)
    }
  }

  if (loading) return <p className="p-4 text-gray-500">加载中…</p>

  return (
    <div className="max-w-sm mx-auto px-4 pt-[10vh]">
      <Link to="/home" className="text-sm text-indigo-600 hover:text-indigo-700">← 返回</Link>
      <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-6">错词复习</h2>

      {loadError && (
        <p className="text-red-600 text-sm mb-4">加载失败，请返回重试</p>
      )}

      {!loadError && errorWords?.length === 0 && (
        <p className="text-gray-500 text-sm">暂无错词记录，完成几次测验后这里会显示需要加强的词</p>
      )}

      {!loadError && !!errorWords?.length && (
        <>
          <div className="flex flex-col gap-2 mb-4">
            {Object.entries(
              errorWords.reduce<Record<string, number>>((acc, w) => {
                acc[w.unit] = (acc[w.unit] ?? 0) + 1
                return acc
              }, {})
            ).map(([unit, count]) => (
              <div key={unit} className="flex justify-between items-center bg-white border border-gray-200 rounded-xl px-4 py-3">
                <span className="text-gray-900 font-medium">{unitTitles[unit] ?? unit}</span>
                <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{count} 词</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 mb-6 text-center">共 {errorWords.length} 个错词</p>
          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full py-2.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {starting ? '加载中…' : '开始复习'}
          </button>
        </>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { WordListMeta } from '../types'

export default function QuizConfigPage() {
  const { unit } = useParams<{ unit: string }>()
  const navigate = useNavigate()
  const [meta, setMeta] = useState<WordListMeta | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!unit) return
    api.getWordList(`${unit}.json`)
      .then(data => setMeta(data.meta))
      .finally(() => setLoading(false))
  }, [unit])

  if (loading) return <p className="p-4 text-gray-500">加载中…</p>
  if (!meta) return <p className="p-4 text-gray-500">词库不存在</p>

  return (
    <div className="max-w-sm mx-auto px-4 pt-[10vh]">
      <Link to="/home" className="text-sm text-indigo-600 hover:text-indigo-700">← 返回</Link>
      <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-1">{meta.title}</h2>
      <p className="text-gray-500 mb-1">{meta.description}</p>
      <p className="text-sm text-gray-400 mb-6">共 {meta.total} 个词</p>
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">选择模式</h3>
      <div className="border-2 border-indigo-600 bg-indigo-50 rounded-xl p-4 mb-6">
        <strong className="text-gray-900 font-semibold">循环队列模式</strong>
        <p className="text-sm text-gray-500 mt-1 mb-0">答错放回队尾，全部答对才完成</p>
      </div>
      <button
        onClick={() => navigate(`/quiz/${unit}/play`)}
        className="w-full py-2.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
      >
        开始测验
      </button>
    </div>
  )
}

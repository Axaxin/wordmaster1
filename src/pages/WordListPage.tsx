import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { WordListIndex } from '../types'

export default function WordListPage() {
  const [lists, setLists] = useState<WordListIndex[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getWordListIndex()
      .then(setLists)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/home" className="text-sm text-indigo-600 hover:text-indigo-700">← 返回</Link>
      <h2 className="text-lg font-semibold text-gray-900 mt-4 mb-3">选择词库</h2>
      {loading && <p className="text-gray-500">加载中…</p>}
      <div className="flex flex-col gap-3">
        {lists.map(item => (
          <Link
            key={item.file}
            to={`/quiz/words/${item.file.replace('.json', '')}/play`}
            className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-900 no-underline"
          >
            <div className="flex justify-between items-start">
              <strong className="font-semibold">{item.title}</strong>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.total} 词</span>
            </div>
            <p className="text-sm text-gray-500 mt-1 mb-0">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

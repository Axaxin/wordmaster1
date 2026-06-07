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

  if (loading) return <p style={{ padding: 16 }}>加载中…</p>
  if (!meta) return <p style={{ padding: 16 }}>词库不存在</p>

  return (
    <div style={{ maxWidth: 400, margin: '10vh auto', padding: '0 16px' }}>
      <Link to="/home">← 返回</Link>
      <h2>{meta.title}</h2>
      <p>{meta.description}</p>
      <p>共 {meta.total} 个词</p>
      <h3>选择模式</h3>
      <div style={{
        padding: 16,
        border: '2px solid #333',
        borderRadius: 8,
        marginBottom: 16,
      }}>
        <strong>循环队列模式</strong>
        <p style={{ margin: '4px 0 0', color: '#555' }}>
          答错放回队尾，全部答对才完成
        </p>
      </div>
      <button
        onClick={() => navigate(`/quiz/${unit}/play`)}
        style={{ width: '100%', padding: '10px', fontSize: 16 }}
      >
        开始测验
      </button>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { StudentStats } from '../types'

export default function StatsPage() {
  const { username } = useAuth()
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!username) return
    api.getStats(username)
      .then(setStats)
      .finally(() => setLoading(false))
  }, [username])

  if (loading) return <p style={{ padding: 16 }}>加载中…</p>

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <Link to="/home">← 返回</Link>
      <h2>{username} 的学习统计</h2>

      <h3>最近会话</h3>
      {!stats?.sessions.length && <p>还没有完成的测验记录</p>}
      <div style={{ display: 'grid', gap: 8 }}>
        {stats?.sessions.map(s => {
          const date = new Date(s.started_at).toLocaleDateString('zh-CN')
          const min = s.duration_ms !== null ? Math.floor(s.duration_ms / 60000) : null
          const sec = s.duration_ms !== null ? Math.floor((s.duration_ms % 60000) / 1000) : null
          return (
            <div key={s.session_id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
              <strong>{s.unit}</strong>
              <span style={{ float: 'right', color: '#888' }}>{date}</span>
              {s.finished_at ? (
                <p style={{ margin: '4px 0 0', color: '#555' }}>
                  {s.rounds} 轮 · {min !== null && min > 0 ? `${min}分` : ''}{sec}秒
                </p>
              ) : (
                <p style={{ margin: '4px 0 0', color: '#aaa' }}>未完成</p>
              )}
            </div>
          )
        })}
      </div>

      {!!stats?.high_error_words.length && (
        <>
          <h3>重点复习词</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>单词</th>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>词库</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>尝试次数</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>正确率</th>
              </tr>
            </thead>
            <tbody>
              {stats.high_error_words.map(w => (
                <tr key={`${w.unit}-${w.word}`} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '4px 8px' }}><strong>{w.word}</strong></td>
                  <td style={{ padding: '4px 8px', color: '#888' }}>{w.unit}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{w.total_attempts}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                    {Math.round((w.correct_count / w.total_attempts) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

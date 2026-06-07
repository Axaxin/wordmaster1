import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { WordListIndex } from '../types'

export default function HomePage() {
  const { username, logout } = useAuth()
  const [lists, setLists] = useState<WordListIndex[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.getWordListIndex()
      .then(setLists)
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>WordMaster</h1>
        <div>
          <span style={{ marginRight: 12 }}>👤 {username}</span>
          <Link to="/stats" style={{ marginRight: 12 }}>我的统计</Link>
          <button onClick={handleLogout}>退出</button>
        </div>
      </div>
      <h2>选择词库</h2>
      {loading && <p>加载中…</p>}
      <div style={{ display: 'grid', gap: 12 }}>
        {lists.map(item => (
          <Link
            key={item.file}
            to={`/quiz/${item.file.replace('.json', '')}`}
            style={{
              display: 'block',
              padding: 16,
              border: '1px solid #ddd',
              borderRadius: 8,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <strong>{item.title}</strong>
            <p style={{ margin: '4px 0 0', color: '#666' }}>{item.description}</p>
            <small>{item.total} 个词</small>
          </Link>
        ))}
      </div>
    </div>
  )
}

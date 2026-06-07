import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export default function LoginPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const username = input.trim()
    if (!username) return
    setLoading(true)
    setError('')
    try {
      await api.login(username)
      login(username)
      navigate('/home')
    } catch {
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '20vh auto', padding: '0 16px' }}>
      <h1>WordMaster</h1>
      <p>输入你的账号名开始学习</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="账号名"
          autoFocus
          style={{ width: '100%', padding: '8px', fontSize: 16, marginBottom: 8 }}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{ width: '100%', padding: '10px', fontSize: 16 }}
        >
          {loading ? '登录中…' : '开始'}
        </button>
      </form>
    </div>
  )
}

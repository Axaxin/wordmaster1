import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { StudentStats } from '../types'

export default function StatsPage() {
  const { username } = useAuth()
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    if (!username) return
    api.getStats(username)
      .then(setStats)
      .finally(() => setLoading(false))
  }, [username])

  const handleClearStats = async () => {
    setClearing(true)
    try {
      await api.clearStats(username!)
      setStats({ sessions: [], high_error_words: [] })
      setConfirmClear(false)
    } catch {
      window.alert('清空失败，请重试')
    } finally {
      setClearing(false)
    }
  }

  if (loading) return <p className="p-4 text-gray-500">加载中…</p>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/home" className="text-sm text-indigo-600 hover:text-indigo-700">← 返回</Link>
      <div className="flex justify-between items-center mt-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">{username} 的学习统计</h2>
        {confirmClear ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">确认清空？</span>
            <button
              onClick={handleClearStats}
              disabled={clearing}
              className="text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clearing ? '清空中…' : '确认'}
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              disabled={clearing}
              className="text-sm text-gray-600 hover:text-gray-800 border border-gray-200 hover:bg-gray-50 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="text-sm text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors"
          >
            清空记录
          </button>
        )}
      </div>

      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">最近会话</h3>
      {!stats?.sessions.length && <p className="text-gray-500 text-sm">还没有完成的测验记录</p>}
      <div className="flex flex-col gap-2 mb-8">
        {stats?.sessions.map(s => {
          const date = new Date(s.started_at).toLocaleDateString('zh-CN')
          const min = s.duration_ms !== null ? Math.floor(s.duration_ms / 60000) : null
          const sec = s.duration_ms !== null ? Math.floor((s.duration_ms % 60000) / 1000) : null
          return (
            <div key={s.session_id} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex justify-between items-center">
                <strong className="font-semibold text-gray-900">
                  {s.unit === 'errors' ? '错词复习' : s.unit === 'forms' ? '比较变化练习' : s.unit === 'verbs' ? '不规则动词练习' : s.unit}
                </strong>
                <span className="text-sm text-gray-400">{date}</span>
              </div>
              {s.finished_at ? (
                <p className="text-sm text-gray-500 mt-1 mb-0">
                  {s.rounds} 轮 · {min !== null && min > 0 ? `${min}分` : ''}{sec}秒
                </p>
              ) : (
                <span className="inline-block mt-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">未完成</span>
              )}
            </div>
          )
        })}
      </div>

      {!!stats?.high_error_words.length && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">重点复习词</h3>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">单词</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">词库</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">尝试</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">正确率</th>
                </tr>
              </thead>
              <tbody>
                {stats.high_error_words.map((w, i) => {
                  const rate = Math.round((w.correct_count / w.total_attempts) * 100)
                  const rateColor = rate >= 80 ? 'text-green-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600'
                  return (
                    <tr key={`${w.unit}-${w.word}`} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-3 font-medium text-gray-900">{w.word}</td>
                      <td className="px-4 py-3 text-gray-500">{w.unit}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{w.total_attempts}</td>
                      <td className={`px-4 py-3 text-right font-medium ${rateColor}`}>{rate}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

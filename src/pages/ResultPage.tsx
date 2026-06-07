import { useLocation, Link } from 'react-router-dom'

interface ResultState {
  unit: string
  rounds: number
  duration_ms: number
}

export default function ResultPage() {
  const { state } = useLocation()
  const { unit, rounds, duration_ms } = (state ?? {}) as Partial<ResultState>
  const minutes = Math.floor((duration_ms ?? 0) / 60000)
  const seconds = Math.floor(((duration_ms ?? 0) % 60000) / 1000)

  return (
    <div style={{ maxWidth: 400, margin: '10vh auto', padding: '0 16px', textAlign: 'center' }}>
      <h2>✅ 完成！</h2>
      {unit && <p>词库：{unit}</p>}
      {rounds !== undefined && <p>共循环 {rounds} 轮</p>}
      {duration_ms !== undefined && (
        <p>用时：{minutes > 0 ? `${minutes} 分 ` : ''}{seconds} 秒</p>
      )}
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {unit && (
          <Link to={`/quiz/${unit}`}>
            <button style={{ width: '100%', padding: '10px', fontSize: 16 }}>再来一次</button>
          </Link>
        )}
        <Link to="/home">
          <button style={{ width: '100%', padding: '10px', fontSize: 16 }}>选其他词库</button>
        </Link>
        <Link to="/stats">
          <button style={{ width: '100%', padding: '10px', fontSize: 16 }}>查看我的统计</button>
        </Link>
      </div>
    </div>
  )
}

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
    <div className="max-w-sm mx-auto px-4 pt-[10vh] text-center">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">完成！</h2>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8 text-left space-y-2">
        {unit && <p className="text-gray-600 m-0">词库：<span className="font-medium text-gray-900">{unit}</span></p>}
        {rounds !== undefined && <p className="text-gray-600 m-0">共循环：<span className="font-medium text-gray-900">{rounds} 轮</span></p>}
        {duration_ms !== undefined && (
          <p className="text-gray-600 m-0">用时：<span className="font-medium text-gray-900">{minutes > 0 ? `${minutes} 分 ` : ''}{seconds} 秒</span></p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {unit && (
          <Link to={`/quiz/${unit}`} className="block w-full py-2.5 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors no-underline">
            再来一次
          </Link>
        )}
        <Link to="/home" className="block w-full py-2.5 text-base font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors no-underline">
          选其他词库
        </Link>
        <Link to="/stats" className="block w-full py-2.5 text-base font-medium text-indigo-600 hover:text-indigo-700 rounded-lg transition-colors no-underline">
          查看我的统计
        </Link>
      </div>
    </div>
  )
}

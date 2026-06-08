import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">WordMaster</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">👤 {username}</span>
          <Link to="/stats" className="text-indigo-600 hover:text-indigo-700 font-medium">我的统计</Link>
          <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">退出</button>
        </div>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">选择模式</h2>
      <div className="flex flex-col gap-3">
        <Link
          to="/quiz/words"
          className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-900 no-underline"
        >
          <strong className="font-semibold">词库练习</strong>
          <p className="text-sm text-gray-500 mt-1 mb-0">从词库中选词，循环测验直到全部答对</p>
        </Link>
        <Link
          to="/quiz/errors"
          className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-900 no-underline"
        >
          <strong className="font-semibold">错词复习</strong>
          <p className="text-sm text-gray-500 mt-1 mb-0">重新测试统计中的高频错词</p>
        </Link>
        <Link
          to="/quiz/forms"
          className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-900 no-underline"
        >
          <strong className="font-semibold">比较变化练习</strong>
          <p className="text-sm text-gray-500 mt-1 mb-0">测试形容词、副词的比较级与最高级变化</p>
        </Link>
        <Link
          to="/quiz/verbs"
          className="block p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-900 no-underline"
        >
          <strong className="font-semibold">不规则动词练习</strong>
          <p className="text-sm text-gray-500 mt-1 mb-0">给出动词原形，填写对应的过去式</p>
        </Link>
      </div>
    </div>
  )
}

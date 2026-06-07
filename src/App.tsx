import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import QuizConfigPage from './pages/QuizConfigPage'
import QuizPlayPage from './pages/QuizPlayPage'
import ResultPage from './pages/ResultPage'
import StatsPage from './pages/StatsPage'

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { username } = useAuth()
  return username ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/quiz/:unit" element={<RequireAuth><QuizConfigPage /></RequireAuth>} />
      <Route path="/quiz/:unit/play" element={<RequireAuth><QuizPlayPage /></RequireAuth>} />
      <Route path="/result" element={<RequireAuth><ResultPage /></RequireAuth>} />
      <Route path="/stats" element={<RequireAuth><StatsPage /></RequireAuth>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

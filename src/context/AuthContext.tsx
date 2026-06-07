import { createContext, useContext, useState, type ReactNode } from 'react'

interface AuthContextValue {
  username: string | null
  login: (username: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'wm_username'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(
    () => sessionStorage.getItem(STORAGE_KEY)
  )

  const login = (name: string) => {
    sessionStorage.setItem(STORAGE_KEY, name)
    setUsername(name)
  }

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ username, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

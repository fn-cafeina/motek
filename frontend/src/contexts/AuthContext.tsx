import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { api } from "../api/client"
import type { User } from "../api/types"

type AuthState = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("motek_token")
    if (!token) {
      setLoading(false)
      return
    }
    api<User>("/api/auth/me")
      .then(setUser)
      .catch(() => localStorage.removeItem("motek_token"))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await api<{ token: string }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    })
    localStorage.setItem("motek_token", res.token)
    const me = await api<User>("/api/auth/me")
    setUser(me)
  }

  async function register(email: string, password: string) {
    await api<{ id: number; email: string }>("/api/auth/register", {
      method: "POST",
      body: { email, password },
    })
    await login(email, password)
  }

  function logout() {
    localStorage.removeItem("motek_token")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

import { useEffect, useState, type ReactNode } from "react"
import { UNAUTHORIZED_EVENT, TOKEN_KEY, api } from "../api/client"
import type { User } from "../api/types"
import { AuthContext } from "./authContext"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(() => !!localStorage.getItem(TOKEN_KEY))

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    let cancelled = false
    api<User>("/api/auth/me")
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onUnauthorized() {
      setUser(null)
      setLoading(false)
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  async function login(email: string, password: string) {
    const res = await api<{ token: string }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    })
    localStorage.setItem(TOKEN_KEY, res.token)
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
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

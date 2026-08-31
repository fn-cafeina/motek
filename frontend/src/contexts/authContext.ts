import { createContext, useContext } from "react"
import type { User } from "../api/types"

export type AuthState = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthState>(null!)

export function useAuth() {
  return useContext(AuthContext)
}

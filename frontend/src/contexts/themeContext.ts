import { createContext, useContext } from "react"

export type ThemePreference = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

export type ThemeContextValue = {
  theme: ThemePreference
  resolved: ResolvedTheme
  setTheme: (theme: ThemePreference) => void
  toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme debe usarse dentro de ThemeProvider")
  return context
}

import { useCallback, useEffect, useMemo, useState } from "react"
import { ThemeContext, type ResolvedTheme, type ThemePreference } from "./themeContext"

const STORAGE_KEY = "motek_theme"

function readStored(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "light" || stored === "dark" || stored === "system") return stored
  return "system"
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(readStored)
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme)

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => setSystem(query.matches ? "dark" : "light")
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  const resolved: ResolvedTheme = theme === "system" ? system : theme

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark")
  }, [resolved])

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Sin localStorage la preferencia dura lo que dure la pestaña.
    }
  }, [])

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark")
  }, [resolved, setTheme])

  const value = useMemo(
    () => ({ theme, resolved, setTheme, toggle }),
    [theme, resolved, setTheme, toggle],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

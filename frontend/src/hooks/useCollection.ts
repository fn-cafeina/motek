import { useCallback, useEffect, useState } from "react"
import { api } from "../api/client"
import { getErrorMessage } from "../lib/errors"

export function useCollection<T>(path: string, fallback: string) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api<T[]>(path)
      setItems(data ?? [])
    } catch (e) {
      setError(getErrorMessage(e, fallback))
    } finally {
      setLoading(false)
    }
  }, [path, fallback])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api<T[]>(path)
        if (!cancelled) setItems(data ?? [])
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e, fallback))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [path, fallback])

  return { items, setItems, loading, error, setError, load }
}

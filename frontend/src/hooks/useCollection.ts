import { useCallback, useEffect, useRef, useState } from "react"
import { api } from "../api/client"
import { getErrorMessage } from "../lib/errors"

export type QueryParams = Record<string, string | undefined>

function buildQuery(params: QueryParams): string {
  const usp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) usp.set(key, value)
  }
  const qs = usp.toString()
  return qs ? `?${qs}` : ""
}

function stableKey(params: QueryParams): string {
  return Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k] ?? ""}`)
    .join("&")
}

export function useCollection<T>(path: string, fallback: string, params: QueryParams = {}) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const paramsKey = stableKey(params)
  const paramsRef = useRef(params)

  useEffect(() => {
    paramsRef.current = params
  })

  const url = `${path}${buildQuery(params)}`

  // Background refetch: keeps the current data visible (no spinner flash) and
  // surfaces a non-blocking inline error if it fails. Intended for follow-ups
  // after create/update/delete; use load() for an explicit full reload.
  const refresh = useCallback(async () => {
    setError(null)
    try {
      const data = await api<T[]>(url)
      setItems(data ?? [])
    } catch (e) {
      setError(getErrorMessage(e, fallback))
    }
  }, [url, fallback])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api<T[]>(url)
      setItems(data ?? [])
    } catch (e) {
      setError(getErrorMessage(e, fallback))
    } finally {
      setLoading(false)
    }
  }, [url, fallback])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    ;(async () => {
      try {
        const data = await api<T[]>(path + buildQuery(paramsRef.current), { signal: controller.signal })
        if (!cancelled) setItems(data ?? [])
      } catch (e) {
        if (!cancelled && !(e instanceof DOMException && e.name === "AbortError")) {
          setError(getErrorMessage(e, fallback))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
      controller.abort()
    }
    // Re-fetch when path or the sorted param set changes; paramsRef avoids
    // re-running on unstable object literals passed inline.
    // oxlint-disable-next-line exhaustive-deps
  }, [path, paramsKey, fallback])

  return { items, setItems, loading, error, setError, load, refresh }
}

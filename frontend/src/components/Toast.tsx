import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, XCircle, X } from "lucide-react"
import { ToastContext, type ToastContextValue } from "./toastContext"

type Toast = { id: number; type: "success" | "error"; message: string }

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [closing, setClosing] = useState<Set<number>>(new Set())
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const remove = useCallback((id: number) => {
    const timersRef = timers.current
    clearTimeout(timersRef.get(id))
    timersRef.delete(id)
    setToasts((prev) => prev.filter((t) => t.id !== id))
    setClosing((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const dismiss = useCallback(
    (id: number) => {
      setClosing((prev) => new Set(prev).add(id))
      setTimeout(() => remove(id), 200)
    },
    [remove],
  )

  const show = useCallback(
    (type: Toast["type"], message: string) => {
      const id = ++nextId
      setToasts((prev) => [...prev, { id, type, message }])
      const timer = setTimeout(() => dismiss(id), 3000)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  const success = useCallback((message: string) => show("success", message), [show])
  const error = useCallback((message: string) => show("error", message), [show])

  useEffect(() => {
    const timersRef = timers.current
    return () => {
      timersRef.forEach((t) => clearTimeout(t))
    }
  }, [])

  const value: ToastContextValue = { success, error }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4 sm:bottom-0 sm:top-auto sm:items-end sm:pb-[max(16px,env(safe-area-inset-bottom))]"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 shadow-lg ${
                closing.has(t.id) ? "motek-toast-exit" : "motek-enter"
              }`}
            >
              {t.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-red-400" />
              )}
              <span className="min-w-0 flex-1 text-xs text-zinc-200">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar"
                className="shrink-0 rounded p-0.5 text-zinc-500 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

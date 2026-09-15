import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, Info, XCircle, X } from "lucide-react"
import { ToastContext, type ToastContextValue } from "./toastContext"

type ToastType = "success" | "error" | "info"
type Toast = { id: number; type: ToastType; message: string }

const ICONS: Record<ToastType, { Icon: typeof Info; className: string }> = {
  success: { Icon: CheckCircle2, className: "text-ok" },
  error: { Icon: XCircle, className: "text-danger" },
  info: { Icon: Info, className: "text-info" },
}

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
      setClosing((prev) => {
        if (prev.has(id)) return prev
        return new Set(prev).add(id)
      })
      setTimeout(() => remove(id), 150)
    },
    [remove],
  )

  const show = useCallback(
    (type: ToastType, message: string) => {
      const id = ++nextId
      setToasts((prev) => [...prev, { id, type, message }])
      const timer = setTimeout(() => dismiss(id), type === "error" ? 5000 : 3000)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  const success = useCallback((message: string) => show("success", message), [show])
  const error = useCallback((message: string) => show("error", message), [show])
  const info = useCallback((message: string) => show("info", message), [show])

  useEffect(() => {
    const timersRef = timers.current
    return () => {
      timersRef.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const value: ToastContextValue = { success, error, info }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-[max(calc(var(--shell-bottom-nav-h)+0.5rem),env(safe-area-inset-bottom))] z-[var(--z-toast)] flex flex-col items-center gap-2 p-3 sm:bottom-[max(16px,env(safe-area-inset-bottom))] sm:items-end sm:p-4"
        >
          {toasts.map((toast) => {
            const { Icon, className } = ICONS[toast.type]
            return (
              <div
                key={toast.id}
                role={toast.type === "error" ? "alert" : "status"}
                aria-live={toast.type === "error" ? "assertive" : "polite"}
                className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 shadow-lg ${
                  closing.has(toast.id) ? "motek-toast-exit" : "motek-enter"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${className}`} aria-hidden />
                <span className="min-w-0 flex-1 text-[13px] leading-[1.4] text-fg">{toast.message}</span>
                <button
                  onClick={() => dismiss(toast.id)}
                  aria-label="Cerrar"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-raised hover:text-fg"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

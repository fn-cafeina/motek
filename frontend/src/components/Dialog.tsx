import { useEffect, useRef, type ReactNode } from "react"
import { X } from "lucide-react"

type DialogProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  maxWidth?: string
  dismissible?: boolean
}

export function Dialog({ open, title, onClose, children, maxWidth = "max-w-lg", dismissible = true }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const justOpened = useRef(false)

  useEffect(() => {
    if (open) justOpened.current = true
  }, [open])

  useEffect(() => {
    if (!open) return
    if (!justOpened.current) return
    justOpened.current = false

    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current

    const focusables = () => {
      if (!panel) return []
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      )
    }

    focusables()[0]?.focus()

    return () => {
      previouslyFocused?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (!dismissible) return
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== "Tab" || !panelRef.current) return
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[var(--z-dialog)] flex items-end justify-center bg-black/60 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm sm:items-center sm:px-4 sm:pb-4"
      onMouseDown={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`motek-dialog-enter flex max-h-[calc(100dvh-1rem)] w-full ${maxWidth} flex-col rounded-t-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50 ring-1 ring-white/[0.06] sm:max-h-[calc(100vh-2rem)] sm:rounded-xl`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2.5 sm:px-4 sm:py-3">
          <h2 className="motek-heading min-w-0 truncate text-[15px] font-semibold leading-[1.25] text-zinc-100">{title}</h2>
          <button
            onClick={onClose}
            disabled={!dismissible}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 sm:h-8 sm:w-8"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain p-3 sm:p-4">{children}</div>
      </div>
    </div>
  )
}

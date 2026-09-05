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
      className="fixed inset-0 z-[var(--z-dialog)] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`motek-dialog-enter flex max-h-[calc(100vh-2rem)] w-full ${maxWidth} flex-col rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50 ring-1 ring-white/[0.06]`}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
          <button
            onClick={onClose}
            disabled={!dismissible}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}

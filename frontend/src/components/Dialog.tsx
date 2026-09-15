import { useId, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { useOverlayBehavior } from "./overlay/useOverlayBehavior"

type DialogProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** Franja fija al pie: para la acción principal de diálogos con lista. */
  footer?: ReactNode
  maxWidth?: string
  dismissible?: boolean
}

export function Dialog({
  open,
  title,
  onClose,
  children,
  footer,
  maxWidth = "max-w-lg",
  dismissible = true,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useOverlayBehavior({ open, onClose, dismissible, panelRef, initialFocus: "first-field" })

  if (!open) return null

  return createPortal(
    <div
      className="motek-overlay-enter fixed inset-0 z-[var(--z-dialog)] flex items-end justify-center bg-black/50 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-[2px] sm:items-center sm:px-4 sm:pb-4"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`motek-dialog-enter flex max-h-[calc(100dvh-1rem)] w-full ${maxWidth} flex-col rounded-t-lg border border-border bg-surface shadow-lg outline-none sm:max-h-[calc(100vh-2rem)] sm:rounded-lg`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 id={titleId} className="motek-heading min-w-0 truncate text-[15px] font-semibold leading-[1.3] text-fg">
            {title}
          </h2>
          <button
            onClick={onClose}
            disabled={!dismissible}
            aria-label="Cerrar"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-fg disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>

        {footer && <div className="shrink-0 border-t border-border px-4 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

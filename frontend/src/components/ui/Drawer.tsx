import { useId, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { useOverlayBehavior } from "../overlay/useOverlayBehavior"

type DrawerProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Ancho desde `sm`. En móvil siempre ocupa la pantalla completa. */
  width?: string
  dismissible?: boolean
}

// Ficha lateral para leer y operar sobre un registro (una orden, una factura) sin
// perder la lista de atrás. Los formularios de alta y edición siguen en Dialog.
export function Drawer({
  open,
  title,
  onClose,
  children,
  footer,
  width = "sm:max-w-[34rem]",
  dismissible = true,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useOverlayBehavior({ open, onClose, dismissible, panelRef, initialFocus: "panel" })

  if (!open) return null

  return createPortal(
    <div
      className="motek-overlay-enter fixed inset-0 z-[var(--z-dialog)] flex justify-end bg-black/50 backdrop-blur-[2px]"
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
        className={`motek-drawer-enter flex h-dvh w-full ${width} flex-col border-l border-border bg-surface shadow-lg outline-none`}
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

        {footer && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-border px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

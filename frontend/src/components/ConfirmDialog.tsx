import { useEffect, useRef } from "react"
import { Dialog } from "./Dialog"

import { buttonClassName } from "./buttonStyles"

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  variant?: "danger" | "primary"
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Eliminar", variant = "danger", busy = false, onConfirm, onClose }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  // The dialog auto-focuses the first focusable element (the close icon); for
  // a destructive confirmation focus should land on the safe action instead.
  useEffect(() => {
    if (open) cancelRef.current?.focus()
  }, [open])

  return (
    <Dialog open={open} title={title} onClose={onClose} maxWidth="max-w-sm">
      {description && <p className="text-xs text-zinc-400">{description}</p>}
      <div className={`flex justify-end gap-2 ${description ? "mt-4" : "mt-0"}`}>
        <button ref={cancelRef} onClick={onClose} disabled={busy} className={buttonClassName("secondary")}>
          Cancelar
        </button>
        <button onClick={onConfirm} disabled={busy} aria-busy={busy} className={buttonClassName(variant)}>
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}

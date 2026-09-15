import { useEffect, useRef } from "react"
import { buttonClassName } from "./buttonStyles"
import { Dialog } from "./Dialog"
import { Alert } from "./ui/Alert"

type BlockedReason = { title: string; description: string }

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  variant?: "danger" | "primary"
  busy?: boolean
  /** Cuando la acción no es posible, se explica el motivo y no se ofrece confirmar. */
  blocked?: BlockedReason
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  variant = "danger",
  busy = false,
  blocked,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const safeRef = useRef<HTMLButtonElement>(null)

  // El diálogo enfoca el primer campo, o el panel si no hay ninguno. En una
  // confirmación destructiva el foco tiene que caer en la acción segura.
  useEffect(() => {
    if (open) safeRef.current?.focus()
  }, [open])

  return (
    <Dialog open={open} title={title} onClose={onClose} maxWidth="max-w-sm">
      {description && <div className="space-y-2 text-[13px] leading-[1.5] text-muted">{description}</div>}

      {blocked && (
        <div className={description ? "mt-3" : undefined}>
          <Alert tone="accent">
            <strong className="font-semibold">{blocked.title}.</strong> {blocked.description}
          </Alert>
        </div>
      )}

      <div className={`flex justify-end gap-2 ${description || blocked ? "mt-4" : ""}`}>
        <button
          ref={safeRef}
          onClick={onClose}
          disabled={busy}
          className={buttonClassName(blocked ? "primary" : "secondary")}
        >
          {blocked ? "Entendido" : "Cancelar"}
        </button>
        {!blocked && (
          <button onClick={onConfirm} disabled={busy} aria-busy={busy} className={buttonClassName(variant)}>
            {confirmLabel}
          </button>
        )}
      </div>
    </Dialog>
  )
}

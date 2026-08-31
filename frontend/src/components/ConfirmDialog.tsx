import { Dialog } from "./Dialog"

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Eliminar", onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Dialog open={open} title={title} onClose={onClose} maxWidth="max-w-sm">
      {description && <p className="text-xs text-zinc-400">{description}</p>}
      <div className={`flex justify-end gap-2 ${description ? "mt-4" : "mt-0"}`}>
        <button
          onClick={onClose}
          className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}

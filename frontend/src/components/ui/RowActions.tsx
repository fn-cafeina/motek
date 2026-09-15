import { Pencil, Trash2 } from "lucide-react"
import type { ReactNode } from "react"

type RowActionButton = {
  onClick: () => void
  label: string
  icon: ReactNode
  tone?: "default" | "info" | "danger"
}

type RowActionsProps = {
  onEdit?: () => void
  onDelete?: () => void
  editLabel?: string
  deleteLabel?: string
  extra?: ReactNode
  actions?: RowActionButton[]
  variant?: "table" | "card"
}

const TONES: Record<NonNullable<RowActionButton["tone"]>, string> = {
  default: "text-muted hover:bg-raised hover:text-fg",
  info: "text-info hover:bg-info-soft",
  danger: "text-danger hover:bg-danger-soft",
}

// Un solo estilo de acción por fila: ghost neutro y el destructivo en rojo.
// Siempre visibles (no solo al pasar el mouse) para que también sirvan en táctil.
export function RowActions({
  onEdit,
  onDelete,
  editLabel = "",
  deleteLabel = "",
  extra,
  actions = [],
  variant = "table",
}: RowActionsProps) {
  const size = variant === "table" ? "h-8 w-8" : "h-9 w-9"
  const base = `flex items-center justify-center rounded-md transition-colors ${size}`

  return (
    <div className="flex items-center justify-end gap-0.5">
      {extra}
      {actions.map((a) => (
        <button key={a.label} onClick={a.onClick} aria-label={a.label} className={`${base} ${TONES[a.tone ?? "default"]}`}>
          {a.icon}
        </button>
      ))}
      {onEdit && (
        <button onClick={onEdit} aria-label={editLabel} className={`${base} ${TONES.default}`}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} aria-label={deleteLabel} className={`${base} ${TONES.danger}`}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

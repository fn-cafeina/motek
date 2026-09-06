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

export function RowActions({ onEdit, onDelete, editLabel = "", deleteLabel = "", extra, actions = [], variant = "table" }: RowActionsProps) {
  const btnBase = variant === "table"
    ? "flex h-8 w-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2"
    : "flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 focus-visible:outline-none focus-visible:ring-2"
  const editCls = variant === "table"
    ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:ring-amber-500"
    : "text-zinc-300 hover:bg-zinc-700 focus-visible:ring-amber-500"
  const deleteCls = "hover:bg-red-950/50 hover:text-red-400 focus-visible:ring-red-500 " + (variant === "table" ? "text-zinc-500" : "text-zinc-400")
  const tones: Record<NonNullable<RowActionButton["tone"]>, string> = {
    default: editCls,
    info: "text-sky-400 hover:bg-sky-500/10 focus-visible:ring-amber-500",
    danger: "text-red-400 hover:bg-red-950/50 focus-visible:ring-red-500",
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {extra}
      {actions.map((a) => (
        <button key={a.label} onClick={a.onClick} aria-label={a.label} className={`${btnBase} ${tones[a.tone ?? "default"]}`}>
          {a.icon}
        </button>
      ))}
      {onEdit && (
        <button onClick={onEdit} aria-label={editLabel} className={`${btnBase} ${editCls}`}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} aria-label={deleteLabel} className={`${btnBase} ${deleteCls}`}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

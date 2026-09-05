import { Pencil, Trash2 } from "lucide-react"
import type { ReactNode } from "react"

type RowActionsProps = {
  onEdit?: () => void
  onDelete?: () => void
  editLabel: string
  deleteLabel: string
  extra?: ReactNode
  variant?: "table" | "card"
}

export function RowActions({ onEdit, onDelete, editLabel, deleteLabel, extra, variant = "table" }: RowActionsProps) {
  const btnBase = variant === "table"
    ? "flex h-8 w-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2"
    : "flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 focus-visible:outline-none focus-visible:ring-2"
  const editCls = variant === "table"
    ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:ring-amber-500"
    : "text-zinc-300 hover:bg-zinc-700 focus-visible:ring-amber-500"
  const deleteCls = "hover:bg-red-950/50 hover:text-red-400 focus-visible:ring-red-500 " + (variant === "table" ? "text-zinc-500" : "text-zinc-400")
  const extraWrap = variant === "table" ? "" : "bg-zinc-800 "

  return (
    <div className="flex items-center justify-end gap-1">
      {extra && <span className={extraWrap}>{extra}</span>}
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

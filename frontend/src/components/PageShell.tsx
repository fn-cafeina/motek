import { CheckCircle2, Loader2, RotateCw } from "lucide-react"
import { Card } from "./Card"
import { buttonClassName } from "./buttonStyles"

export function PageHeader({
  title,
  count,
  action,
}: {
  title: string
  count?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h1 className="flex items-baseline gap-2 text-lg font-semibold tracking-tight text-zinc-100">
        {title}
        {count !== undefined && count !== null && count !== "" && (
          <span role="status" className="text-xs font-normal text-zinc-400">
            {count}
          </span>
        )}
      </h1>
      {action}
    </div>
  )
}

export function InlineError({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-md bg-red-950/50 px-3 py-2 text-xs text-red-400">
      {message}
    </p>
  )
}

type EmptyProps = {
  title: React.ReactNode
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export function DataCard({
  loading,
  loadingText,
  error,
  errorTitle,
  onRetry,
  empty,
  children,
}: {
  loading: boolean
  loadingText: string
  error: string | null
  errorTitle: string
  onRetry: () => void
  empty: EmptyProps | null
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden border-zinc-800 p-0">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {loadingText}
        </div>
      ) : error && empty ? (
        <div className="p-8 text-center">
          <p className="text-sm font-medium text-zinc-200">{errorTitle}</p>
          <p className="mt-1 text-xs text-zinc-400">{error}</p>
          <button onClick={onRetry} className={"mt-4 " + buttonClassName("primary")}>
            <RotateCw className="h-3.5 w-3.5" /> Reintentar
          </button>
        </div>
      ) : empty ? (
        <div className="p-8 text-center">
          {empty.icon ?? null}
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-200">{empty.title}</p>
          {empty.description && <p className="mt-1 text-xs text-zinc-400">{empty.description}</p>}
          {empty.action && <div className="mt-4 flex justify-center">{empty.action}</div>}
        </div>
      ) : (
        children
      )}
    </Card>
  )
}

export function EmptyCheckIcon() {
  return <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/70" />
}

import { CheckCircle2, Loader2, RotateCw } from "lucide-react"
import { Card } from "./Card"
import { buttonClassName } from "./buttonStyles"
import { Alert } from "./ui/Alert"
import { EmptyState, type EmptyStateProps } from "./ui/EmptyState"

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
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h1 className="motek-heading flex min-w-0 flex-wrap items-baseline gap-2 text-[22px] font-semibold leading-[1.15] tracking-tight text-zinc-100">
        {title}
        {count !== undefined && count !== null && count !== "" && (
          <span role="status" className="text-xs font-normal leading-[1.4] tracking-wide text-zinc-400">
            {count}
          </span>
        )}
      </h1>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function InlineError({ message }: { message: string }) {
  return <Alert>{message}</Alert>
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
  empty: EmptyStateProps | null
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden border-zinc-800 p-0 shadow-[0_1px_2px_rgb(0_0_0/0.22),0_8px_24px_rgb(0_0_0/0.18)] [-webkit-overflow-scrolling:touch]">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs leading-[1.5] text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {loadingText}
        </div>
      ) : error && empty ? (
        <div className="motek-prose mx-auto p-8 text-center">
          <p className="motek-heading text-[15px] font-semibold leading-[1.25] text-zinc-200">{errorTitle}</p>
          <p className="mt-1 text-xs leading-[1.6] text-zinc-400">{error}</p>
          <button onClick={onRetry} className={"mt-4 " + buttonClassName("primary")}>
            <RotateCw className="h-3.5 w-3.5" /> Reintentar
          </button>
        </div>
      ) : empty ? (
        <EmptyState {...empty} />
      ) : (
        children
      )}
    </Card>
  )
}

export function EmptyCheckIcon() {
  return <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/70" />
}

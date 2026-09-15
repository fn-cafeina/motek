import { CheckCircle2, RotateCw, TriangleAlert } from "lucide-react"
import { Card } from "./Card"
import { buttonClassName } from "./buttonStyles"
import { Alert } from "./ui/Alert"
import { EmptyState, type EmptyStateProps } from "./ui/EmptyState"
import { TableSkeleton } from "./ui/Skeleton"

/**
 * En escritorio el título vive en el topbar. Acá solo se muestra en móvil, donde el
 * topbar carga la marca, para que no haya dos H1 en la misma pantalla.
 */
export function PageHeader({ title }: { title: string }) {
  return (
    <div className="lg:hidden">
      <h1 className="motek-heading text-[20px] font-semibold leading-tight tracking-tight text-fg">{title}</h1>
    </div>
  )
}

export function InlineError({ message }: { message: string }) {
  return (
    <Alert tone="danger" live>
      {message}
    </Alert>
  )
}

export function DataCard({
  loading,
  loadingText,
  error,
  errorTitle,
  onRetry,
  empty,
  toolbar,
  children,
}: {
  loading: boolean
  loadingText: string
  error: string | null
  errorTitle: string
  onRetry: () => void
  empty: EmptyStateProps | null
  toolbar?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      {toolbar && <div className="border-b border-border px-4 py-3">{toolbar}</div>}
      {loading ? (
        <TableSkeleton label={loadingText} />
      ) : error && empty ? (
        <div role="alert">
          <EmptyState
            title={errorTitle}
            description={error}
            icon={<TriangleAlert className="h-5 w-5 text-danger" />}
            action={
              <button onClick={onRetry} className={buttonClassName("secondary")}>
                <RotateCw className="h-4 w-4" aria-hidden /> Reintentar
              </button>
            }
          />
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
  return <CheckCircle2 className="h-5 w-5 text-ok" />
}

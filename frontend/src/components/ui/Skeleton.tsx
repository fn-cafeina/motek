export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-raised motion-reduce:animate-none ${className}`}
    />
  )
}

// Placeholder de lista: sirve igual para la tabla de escritorio y para las tarjetas
// de móvil, así no hay que duplicar markup por breakpoint.
export function TableSkeleton({
  rows = 5,
  widths = ["w-40", "w-28", "w-24", "w-14"],
  label = "Cargando datos",
}: {
  rows?: number
  widths?: string[]
  label?: string
}) {
  return (
    <div role="status" className="divide-y divide-border">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-6 px-4 py-3">
          {widths.map((width, col) => (
            <Skeleton key={col} className={`h-3.5 ${width}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function StatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <span className="sr-only">Cargando resumen</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-surface p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-20" />
        </div>
      ))}
    </div>
  )
}

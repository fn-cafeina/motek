import { Wrench } from "lucide-react"

export function Brand({ subtitle, compact }: { subtitle?: string; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-fg">
        <Wrench className="size-4" aria-hidden />
      </span>
      {!compact && (
        <span className="min-w-0 text-left">
          <span className="block text-[15px] font-semibold leading-tight tracking-tight text-fg">Motek</span>
          {subtitle && <span className="block truncate text-[11px] leading-tight text-muted">{subtitle}</span>}
        </span>
      )}
    </span>
  )
}

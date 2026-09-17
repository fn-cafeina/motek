import { Link } from "react-router"
import type { LucideIcon } from "lucide-react"

type NavItemProps = {
  to: string
  label: string
  icon: LucideIcon
  active: boolean
  badge?: number
  badgeTone?: "neutral" | "accent"
  /** Barra lateral colapsada: solo icono, con tooltip nativo. */
  collapsed?: boolean
  /** Barra inferior de móvil. */
  compact?: boolean
}

const BADGE_TONES = {
  neutral: "border-border bg-raised text-muted",
  accent: "border-accent/25 bg-accent-soft text-accent",
} as const

export function NavItem({
  to,
  label,
  icon: Icon,
  active,
  badge,
  badgeTone = "neutral",
  collapsed,
  compact,
}: NavItemProps) {
  const showBadge = typeof badge === "number" && badge > 0
  // Sin espacio para el número, solo se avisa de lo que exige atención.
  const showDot = showBadge && badgeTone === "accent"

  if (compact) {
    return (
      <Link
        to={to}
        aria-current={active ? "page" : undefined}
        className={`relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-md px-0.5 py-1.5 text-center text-[10px] leading-tight transition-colors sm:text-[11px] ${
          active ? "font-semibold text-primary" : "font-medium text-muted hover:text-fg"
        }`}
      >
        {active && <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" aria-hidden />}
        <span className="relative">
          <Icon className="size-5" aria-hidden />
          {showDot && <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-accent" aria-hidden />}
        </span>
        <span className="max-w-full truncate tracking-tight">{label}</span>
      </Link>
    )
  }

  if (collapsed) {
    return (
      <Link
        to={to}
        aria-current={active ? "page" : undefined}
        title={label}
        aria-label={label}
        className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
          active ? "bg-primary-soft text-primary" : "text-muted hover:bg-raised hover:text-fg"
        }`}
      >
        <Icon className="size-5" aria-hidden />
        {showDot && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" aria-hidden />}
      </Link>
    )
  }

  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`relative flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium transition-colors ${
        active ? "bg-primary-soft text-primary" : "text-muted hover:bg-raised hover:text-fg"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" aria-hidden />
      )}
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
      {showBadge && (
        <span
          className={`ml-auto shrink-0 rounded-md border px-1.5 text-[11px] font-semibold tabular-nums ${BADGE_TONES[badgeTone]}`}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}

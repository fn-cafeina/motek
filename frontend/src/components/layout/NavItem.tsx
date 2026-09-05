import { Link } from "react-router"
import type { LucideIcon } from "lucide-react"

export function NavItem({
  to,
  label,
  icon: Icon,
  active,
  compact,
}: {
  to: string
  label: string
  icon: LucideIcon
  active: boolean
  compact?: boolean
}) {
  if (compact) {
    return (
      <Link
        to={to}
        aria-current={active ? "page" : undefined}
        className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 whitespace-nowrap rounded-lg px-1.5 py-2 text-center text-[10px] font-medium leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
          active ? "bg-amber-500 text-zinc-900" : "text-zinc-500 hover:text-zinc-200"
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden />
        {label}
      </Link>
    )
  }

  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
        active ? "bg-amber-500 font-semibold text-zinc-900" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> {label}
    </Link>
  )
}

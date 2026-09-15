import { useLocation } from "react-router"
import { NavItem } from "./NavItem"
import { NAV_ITEMS, isActive } from "./nav"
import { useResumen } from "../../contexts/resumenContext"
import { ordenesActivas } from "../../lib/resumen"

export function BottomNav() {
  const { pathname } = useLocation()
  const { ordenes, stockCritico } = useResumen()

  const badges = {
    ordenesActivas: ordenesActivas(ordenes).length,
    stockCritico: stockCritico.length,
  }

  return (
    <nav
      aria-label="Principal móvil"
      className="fixed inset-x-0 bottom-0 z-[var(--z-header)] border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="grid grid-cols-6 gap-0.5 px-1.5 py-1">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            active={isActive(pathname, item)}
            badge={item.badge ? badges[item.badge.source] : undefined}
            badgeTone={item.badge?.tone}
            compact
          />
        ))}
      </div>
    </nav>
  )
}

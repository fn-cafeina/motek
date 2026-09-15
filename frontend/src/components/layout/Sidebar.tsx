import { useCallback, useState } from "react"
import { Link, useLocation } from "react-router"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Brand } from "./Brand"
import { NavGroup } from "./NavGroup"
import { NavItem } from "./NavItem"
import { NAV_GROUPS, isActive } from "./nav"
import { useResumen } from "../../contexts/resumenContext"
import { ordenesActivas } from "../../lib/resumen"

const STORAGE_KEY = "motek_sidebar"

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === "collapsed")
  const { pathname } = useLocation()
  const { ordenes, stockCritico } = useResumen()

  const badges = {
    ordenesActivas: ordenesActivas(ordenes).length,
    stockCritico: stockCritico.length,
  }

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded")
      } catch {
        // Sin localStorage la preferencia dura lo que dure la pestaña.
      }
      return next
    })
  }, [])

  const CollapseIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-e border-border bg-surface transition-[width] duration-150 lg:flex ${
        collapsed ? "w-[var(--shell-sidebar-rail)]" : "w-[var(--shell-sidebar-w)]"
      }`}
    >
      <div className={`flex h-14 shrink-0 items-center border-b border-border ${collapsed ? "justify-center px-2" : "px-4"}`}>
        <Link to="/" aria-label="Ir al inicio" className="min-w-0">
          <Brand compact={collapsed} />
        </Link>
      </div>

      <nav aria-label="Principal" className={`flex-1 overflow-y-auto py-4 ${collapsed ? "px-2" : "px-3"}`}>
        {NAV_GROUPS.map((group) => (
          <NavGroup key={group.group} label={group.group} collapsed={collapsed}>
            {group.items.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                active={isActive(pathname, item)}
                badge={item.badge ? badges[item.badge.source] : undefined}
                badgeTone={item.badge?.tone}
                collapsed={collapsed}
              />
            ))}
          </NavGroup>
        ))}
      </nav>

      <div className={`shrink-0 border-t border-border ${collapsed ? "flex justify-center p-2" : "p-3"}`}>
        <button
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
          title={collapsed ? "Expandir menú" : "Contraer menú"}
          className={`flex h-9 items-center gap-2 rounded-md text-[13px] font-medium text-muted transition-colors hover:bg-raised hover:text-fg ${
            collapsed ? "w-9 justify-center" : "w-full px-3"
          }`}
        >
          <CollapseIcon className="size-5 shrink-0" aria-hidden />
          {!collapsed && <span>Contraer</span>}
        </button>
      </div>
    </aside>
  )
}

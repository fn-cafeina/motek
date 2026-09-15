import { ClipboardList, FileText, LayoutDashboard, Package, TriangleAlert, Users, type LucideIcon } from "lucide-react"

export type NavItemConfig = {
  to: string
  label: string
  icon: LucideIcon
  /** Coincidencia exacta: solo para la raíz, que si no matchea con todo. */
  exact?: boolean
  /** Contador derivado del resumen. `accent` se reserva para lo que exige atención. */
  badge?: { source: "ordenesActivas" | "stockCritico"; tone: "neutral" | "accent" }
}

export const NAV_GROUPS: { group: string; items: NavItemConfig[] }[] = [
  {
    group: "Taller",
    items: [
      { to: "/", label: "Inicio", icon: LayoutDashboard, exact: true },
      { to: "/ordenes", label: "Órdenes", icon: ClipboardList, badge: { source: "ordenesActivas", tone: "neutral" } },
      { to: "/clientes", label: "Clientes", icon: Users },
      { to: "/repuestos", label: "Repuestos", icon: Package },
    ],
  },
  {
    group: "Administración",
    items: [
      { to: "/facturas", label: "Facturas", icon: FileText },
      { to: "/alertas", label: "Alertas", icon: TriangleAlert, badge: { source: "stockCritico", tone: "accent" } },
    ],
  },
]

export const NAV_ITEMS: NavItemConfig[] = NAV_GROUPS.flatMap((group) => group.items)

export function isActive(pathname: string, item: NavItemConfig): boolean {
  if (item.exact) return pathname === item.to
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function sectionLabel(pathname: string): string {
  return NAV_ITEMS.find((item) => isActive(pathname, item))?.label ?? "Motek"
}

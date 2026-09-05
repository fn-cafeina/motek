import { useEffect, useState } from "react"
import { Link, Outlet, useNavigate, useLocation } from "react-router"
import { Users, ClipboardList, Package, FileText, TriangleAlert } from "lucide-react"
import { useAuth } from "../contexts/authContext"
import { buttonClassName } from "./buttonStyles"
import { ConfirmDialog } from "./ConfirmDialog"
import { Brand } from "./layout/Brand"
import { NavItem } from "./layout/NavItem"
import { PageContainer } from "./layout/PageContainer"

const NAV = [
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/ordenes", label: "Órdenes", icon: ClipboardList },
  { to: "/repuestos", label: "Repuestos", icon: Package },
  { to: "/facturas", label: "Facturas", icon: FileText },
  { to: "/alertas", label: "Alertas", icon: TriangleAlert },
] as const

const TITLES: Record<string, string> = {
  "/clientes": "Clientes — Motek",
  "/ordenes": "Órdenes — Motek",
  "/repuestos": "Repuestos — Motek",
  "/facturas": "Facturas — Motek",
  "/alertas": "Alertas — Motek",
}

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => {
    const key = "/" + location.pathname.split("/").filter(Boolean)[0]
    document.title = TITLES[key] ?? "Motek"
  }, [location.pathname])

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-100 antialiased">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-md focus:bg-zinc-900 focus:px-3 focus:py-2 focus:text-sm focus:text-zinc-100 focus:ring-2 focus:ring-amber-500">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-[var(--z-header)] border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
        <div className="flex items-center justify-between gap-2 px-3 pt-[max(10px,env(safe-area-inset-top))] pb-2.5 sm:px-4">
          <Link to="/" aria-label="Inicio" className="min-w-0">
            <Brand />
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden max-w-40 truncate text-xs text-zinc-400 sm:inline" title={user?.email}>{user?.email}</span>
            <span className="max-w-28 truncate text-xs text-zinc-500 sm:hidden" title={user?.email}>{user?.email}</span>
            <button onClick={() => setConfirmLogout(true)} className={buttonClassName("secondary")}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-[var(--shell-sidebar-w)] shrink-0 border-e border-zinc-800 sm:block">
          <nav aria-label="Principal" className="sticky top-[var(--shell-header-h)] flex flex-col gap-0.5 p-3 text-xs">
            {NAV.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} active={location.pathname.startsWith(item.to)} />
            ))}
          </nav>
        </aside>

        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-3 pb-[max(calc(var(--shell-bottom-nav-h)+0.5rem),env(safe-area-inset-bottom))] pt-3 focus:outline-none sm:px-5 sm:pb-5 sm:pt-5">
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
      </div>

      <nav aria-label="Principal móvil" className="fixed inset-x-0 bottom-0 z-[var(--z-header)] border-t border-zinc-800 bg-zinc-950 px-1.5 pb-[max(6px,env(safe-area-inset-bottom))] pt-1 sm:hidden">
        <div className="grid grid-cols-5 gap-1">
          {NAV.map((item) => (
            <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} active={location.pathname.startsWith(item.to)} compact />
          ))}
        </div>
      </nav>

      <ConfirmDialog
        open={confirmLogout}
        title="¿Salir de Motek?"
        description={user ? `Cerrarás la sesión de ${user.email}.` : "Cerrarás tu sesión."}
        confirmLabel="Salir"
        variant="primary"
        onConfirm={() => {
          setConfirmLogout(false)
          handleLogout()
        }}
        onClose={() => setConfirmLogout(false)}
      />
    </div>
  )
}

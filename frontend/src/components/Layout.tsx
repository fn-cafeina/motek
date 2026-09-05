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
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 antialiased">
      <header className="sticky top-0 z-[var(--z-header)] border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between px-4 pt-[max(10px,env(safe-area-inset-top))] pb-2.5">
          <Link to="/" aria-label="Inicio">
            <Brand />
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-zinc-400 sm:inline">{user?.email}</span>
            <button onClick={() => setConfirmLogout(true)} className={buttonClassName("secondary")}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-[var(--shell-sidebar-w)] shrink-0 border-e border-zinc-800 sm:block">
          <nav className="sticky top-[var(--shell-header-h)] flex flex-col gap-0.5 p-3 text-xs">
            {NAV.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} active={location.pathname.startsWith(item.to)} />
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 pb-[max(var(--shell-bottom-nav-h),env(safe-area-inset-bottom))] sm:p-5 sm:pb-5">
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-[var(--z-header)] border-t border-zinc-800 bg-zinc-950 px-2 pb-[max(4px,env(safe-area-inset-bottom))] pt-1.5 sm:hidden">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
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

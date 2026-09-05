import { useState } from "react"
import { Link, Outlet, useNavigate, useLocation } from "react-router"
import { useAuth } from "../contexts/authContext"
import { ConfirmDialog } from "./ConfirmDialog"

const NAV = [
  { to: "/clientes", label: "Clientes" },
  { to: "/ordenes", label: "Órdenes" },
  { to: "/repuestos", label: "Repuestos" },
  { to: "/facturas", label: "Facturas" },
  { to: "/alertas", label: "Alertas" },
]

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [confirmLogout, setConfirmLogout] = useState(false)

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 antialiased">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between px-4 pt-[max(10px,env(safe-area-inset-top))] pb-2.5">
          <Link to="/" className="text-base font-bold tracking-tight">
            <span className="text-amber-500">Mo</span>tek
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-zinc-400 sm:inline">{user?.email}</span>
            <button
              onClick={() => setConfirmLogout(true)}
              className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-48 shrink-0 border-s-0 border-e border-zinc-800 sm:block">
          <nav className="sticky top-[41px] flex flex-col gap-0.5 p-3 text-xs">
            {NAV.map((item) => {
              const active = location.pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-md px-2.5 py-1.5 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    active
                      ? "bg-amber-500 text-zinc-900"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 pb-[max(76px,env(safe-area-inset-bottom))] sm:p-5 sm:pb-5">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-800 bg-zinc-950 px-2 pb-[max(4px,env(safe-area-inset-bottom))] pt-1.5 sm:hidden">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {NAV.map((item) => {
            const active = location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`min-w-0 flex-1 whitespace-nowrap rounded-md px-2 py-2 text-center text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  active ? "bg-amber-500 text-zinc-900" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <ConfirmDialog
        open={confirmLogout}
        title="¿Salir de Motek?"
        description={user ? `Cerrarás la sesión de ${user.email}.` : "Cerrarás tu sesión."}
        confirmLabel="Salir"
        onConfirm={() => {
          setConfirmLogout(false)
          handleLogout()
        }}
        onClose={() => setConfirmLogout(false)}
      />
    </div>
  )
}

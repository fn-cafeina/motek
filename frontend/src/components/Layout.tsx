import { Link, Outlet, useNavigate, useLocation } from "react-router"
import { useAuth } from "../contexts/AuthContext"

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

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 antialiased">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link to="/" className="text-base font-bold tracking-tight">
            <span className="text-amber-500">Mo</span>tek
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-zinc-400 sm:inline">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-zinc-800 bg-zinc-950 px-2 py-1.5 sm:hidden">
        {NAV.map((item) => {
          const active = location.pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                active ? "bg-amber-500 text-zinc-900" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-1">
        <aside className="hidden w-48 shrink-0 border-r border-zinc-800 sm:block">
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

        <main className="min-w-0 flex-1 p-4 sm:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

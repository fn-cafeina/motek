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
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-bold tracking-tight">
            <span className="text-amber-600">Mo</span>tek
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-stone-500 sm:inline">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="rounded-full bg-stone-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-stone-800"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl">
        <aside className="hidden w-48 shrink-0 border-r border-stone-200 bg-white p-4 sm:block">
          <nav className="flex flex-col gap-1 text-sm">
            {NAV.map((item) => {
              const active = location.pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-lg px-3 py-2 font-medium transition ${
                    active
                      ? "bg-amber-500 text-white"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <nav className="flex gap-1 overflow-x-auto border-b border-stone-200 bg-white px-2 py-2 sm:hidden">
          {NAV.map((item) => {
            const active = location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${
                  active ? "bg-amber-500 text-white" : "bg-stone-100 text-stone-600"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

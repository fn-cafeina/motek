import { Link, Outlet, useNavigate } from "react-router"
import { useAuth } from "../contexts/AuthContext"

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-bold">
            Motek
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl">
        <aside className="w-48 shrink-0 border-r bg-white p-4">
          <nav className="flex flex-col gap-1 text-sm">
            <Link to="/clientes" className="rounded px-3 py-2 hover:bg-gray-100">
              Clientes
            </Link>
            <Link to="/ordenes" className="rounded px-3 py-2 hover:bg-gray-100">
              Órdenes
            </Link>
            <Link to="/repuestos" className="rounded px-3 py-2 hover:bg-gray-100">
              Repuestos
            </Link>
            <Link to="/facturas" className="rounded px-3 py-2 hover:bg-gray-100">
              Facturas
            </Link>
            <Link to="/alertas" className="rounded px-3 py-2 hover:bg-gray-100">
              Alertas
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

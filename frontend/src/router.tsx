import { createBrowserRouter, Link, Navigate } from "react-router"
import { Layout } from "./components/Layout"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Alertas } from "./pages/Alertas"
import { Clientes } from "./pages/Clientes"
import { Facturas } from "./pages/Facturas"
import { Login } from "./pages/Login"
import { Ordenes } from "./pages/Ordenes"
import { Register } from "./pages/Register"
import { Repuestos } from "./pages/Repuestos"
import { buttonClassName } from "./components/buttonStyles"

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-950 p-8 text-center">
      <p className="text-sm font-semibold text-zinc-100">Página no encontrada</p>
      <p className="text-xs text-zinc-400">La ruta no existe.</p>
      <Link to="/" className={buttonClassName("primary")}>
        Volver al inicio
      </Link>
    </div>
  )
}

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/clientes" replace /> },
      { path: "clientes", element: <Clientes /> },
      { path: "ordenes", element: <Ordenes /> },
      { path: "repuestos", element: <Repuestos /> },
      { path: "facturas", element: <Facturas /> },
      { path: "alertas", element: <Alertas /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  { path: "*", element: <NotFound /> },
])

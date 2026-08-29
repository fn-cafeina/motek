import { createBrowserRouter, Navigate } from "react-router"
import { Layout } from "./components/Layout"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Clientes } from "./pages/Clientes"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h1 className="text-sm font-semibold text-zinc-100">{title}</h1>
      <p className="mt-1 text-xs text-zinc-500">Contenido próximamente</p>
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
      { path: "ordenes", element: <Placeholder title="Órdenes" /> },
      { path: "repuestos", element: <Placeholder title="Repuestos" /> },
      { path: "facturas", element: <Placeholder title="Facturas" /> },
      { path: "alertas", element: <Placeholder title="Alertas" /> },
    ],
  },
])

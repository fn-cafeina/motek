import { createBrowserRouter, Navigate } from "react-router"
import { Layout } from "./components/Layout"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-stone-500">Contenido próximamente</p>
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
      { path: "clientes", element: <Placeholder title="Clientes" /> },
      { path: "ordenes", element: <Placeholder title="Órdenes" /> },
      { path: "repuestos", element: <Placeholder title="Repuestos" /> },
      { path: "facturas", element: <Placeholder title="Facturas" /> },
      { path: "alertas", element: <Placeholder title="Alertas" /> },
    ],
  },
])

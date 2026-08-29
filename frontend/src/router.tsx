import { createBrowserRouter, Navigate } from "react-router"
import { Layout } from "./components/Layout"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"

function Placeholder({ title }: { title: string }) {
  return <h1 className="text-xl font-semibold">{title}</h1>
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

import { createBrowserRouter, Navigate } from "react-router"
import { Layout } from "./components/Layout"
import { Placeholder } from "./components/Placeholder"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Clientes } from "./pages/Clientes"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"

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

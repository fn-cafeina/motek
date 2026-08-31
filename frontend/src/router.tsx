import { createBrowserRouter, Navigate } from "react-router"
import { Layout } from "./components/Layout"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Alertas } from "./pages/Alertas"
import { Clientes } from "./pages/Clientes"
import { Facturas } from "./pages/Facturas"
import { Login } from "./pages/Login"
import { Ordenes } from "./pages/Ordenes"
import { Register } from "./pages/Register"
import { Repuestos } from "./pages/Repuestos"

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
    ],
  },
])

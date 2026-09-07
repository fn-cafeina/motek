import { createBrowserRouter, Navigate } from "react-router"
import { Layout } from "./components/Layout"
import { NotFound } from "./components/NotFound"
import { ProtectedRoute } from "./components/ProtectedRoute"

// Route-level code splitting: each page loads its own chunk on demand.
// Loaders are inlined (not component-shaped consts) to keep fast refresh happy.
export const router = createBrowserRouter([
  { path: "/login", lazy: () => import("./pages/Login").then((m) => ({ Component: m.Login })) },
  { path: "/register", lazy: () => import("./pages/Register").then((m) => ({ Component: m.Register })) },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/clientes" replace /> },
      { path: "clientes", lazy: () => import("./pages/Clientes").then((m) => ({ Component: m.Clientes })) },
      { path: "ordenes", lazy: () => import("./pages/Ordenes").then((m) => ({ Component: m.Ordenes })) },
      { path: "repuestos", lazy: () => import("./pages/Repuestos").then((m) => ({ Component: m.Repuestos })) },
      { path: "facturas", lazy: () => import("./pages/Facturas").then((m) => ({ Component: m.Facturas })) },
      { path: "alertas", lazy: () => import("./pages/Alertas").then((m) => ({ Component: m.Alertas })) },
      { path: "*", element: <NotFound embedded /> },
    ],
  },
  { path: "*", element: <NotFound /> },
])

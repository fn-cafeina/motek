import { RouterProvider } from "react-router"
import { AuthProvider } from "./contexts/AuthContext"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { ToastProvider } from "./components/Toast"
import { router } from "./router"

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

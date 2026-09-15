import { RouterProvider } from "react-router"
import { AuthProvider } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { ToastProvider } from "./components/Toast"
import { router } from "./router"

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

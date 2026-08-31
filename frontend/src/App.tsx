import { RouterProvider } from "react-router"
import { AuthProvider } from "./contexts/AuthContext"
import { ToastProvider } from "./components/Toast"
import { router } from "./router"

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  )
}

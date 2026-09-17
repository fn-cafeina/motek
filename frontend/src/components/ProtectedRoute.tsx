import { Navigate } from "react-router"
import { useAuth } from "../contexts/authContext"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main role="status" className="flex min-h-dvh items-center justify-center bg-canvas text-[13px] text-muted">
        Cargando la sesión
      </main>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

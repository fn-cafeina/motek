import { Navigate } from "react-router"
import { useAuth } from "../contexts/AuthContext"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Cargando...</div>
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

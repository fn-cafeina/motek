import { Navigate } from "react-router"
import { useAuth } from "../contexts/authContext"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-500">Cargando...</div>
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

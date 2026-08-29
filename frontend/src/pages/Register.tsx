import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { ApiError } from "../api/client"
import { AuthCard } from "../components/AuthCard"
import { useAuth } from "../contexts/AuthContext"

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await register(email, password)
      navigate("/")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al registrarse")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Crear cuenta">
      <form onSubmit={onSubmit}>
        {error && (
          <p role="alert" className="mb-3 rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <label htmlFor="register-email" className="mb-2.5 block">
          <span className="text-sm font-medium text-zinc-300">Email</span>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-2 text-base text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/40 focus:ring-offset-0"
          />
        </label>
        <label htmlFor="register-pass" className="mb-3.5 block">
          <span className="text-sm font-medium text-zinc-300">Contraseña (mín. 6)</span>
          <input
            id="register-pass"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-2 text-base text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/40 focus:ring-offset-0"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="motek-press w-full rounded-md bg-amber-500 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50"
        >
          {loading ? "..." : "Registrarse"}
        </button>
        <p className="mt-3.5 text-center text-sm text-zinc-400">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-amber-500 hover:text-amber-400">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}

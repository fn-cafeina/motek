import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { ApiError } from "../api/client"
import { AuthCard } from "../components/AuthCard"
import { useAuth } from "../contexts/AuthContext"

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passRef = useRef<HTMLInputElement>(null)

  function validate(): boolean {
    const next: typeof fieldErrors = {}
    if (!email.trim()) next.email = "Ingresá tu email"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Email inválido"
    if (!password) next.password = "Ingresá tu contraseña"
    setFieldErrors(next)
    if (next.email) {
      emailRef.current?.focus()
      return false
    }
    if (next.password) {
      passRef.current?.focus()
      return false
    }
    return true
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!validate()) return
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate("/")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  const emailInvalid = !!fieldErrors.email
  const passInvalid = !!fieldErrors.password

  return (
    <AuthCard title="Iniciar sesión">
      <form onSubmit={onSubmit} noValidate>
        {error && (
          <p role="alert" className="mb-2.5 rounded-md bg-red-950/50 px-2.5 py-1.5 text-xs text-red-400">
            {error}
          </p>
        )}
        <label htmlFor="login-email" className="mb-2 block">
          <span className="text-xs font-medium tracking-wide text-zinc-400">Email</span>
          <input
            ref={emailRef}
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }))
            }}
            onBlur={validate}
            required
            aria-invalid={emailInvalid}
            aria-describedby={emailInvalid ? "login-email-error" : undefined}
            className={`mt-1 w-full rounded-md border bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${emailInvalid ? "border-red-500 focus:border-red-500 focus-visible:ring-red-500" : "border-zinc-700 focus:border-amber-500"}`}
          />
          {emailInvalid && (
            <p id="login-email-error" className="mt-1 text-xs text-red-400">
              {fieldErrors.email}
            </p>
          )}
        </label>
        <label htmlFor="login-pass" className="mb-2.5 block">
          <span className="text-xs font-medium tracking-wide text-zinc-400">Contraseña</span>
          <div className="relative mt-1">
            <input
              ref={passRef}
              id="login-pass"
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }))
              }}
              required
              aria-invalid={passInvalid}
              aria-describedby={passInvalid ? "login-pass-error" : undefined}
              className={`w-full rounded-md border bg-zinc-800 px-2.5 py-1.5 pr-9 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${passInvalid ? "border-red-500 focus:border-red-500 focus-visible:ring-red-500" : "border-zinc-700 focus:border-amber-500"}`}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showPass}
              className="absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          {passInvalid && (
            <p id="login-pass-error" className="mt-1 text-xs text-red-400">
              {fieldErrors.password}
            </p>
          )}
        </label>
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="motek-press inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-amber-500 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p className="mt-2.5 text-center text-xs text-zinc-400">
          ¿Sin cuenta?{" "}
          <Link to="/register" className="font-medium text-amber-500 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            Registrarse
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}

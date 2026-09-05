import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { ApiError } from "../api/client"
import { AuthCard } from "../components/AuthCard"
import { Field } from "../components/Field"
import { buttonClassName } from "../components/buttonStyles"
import { inputClassName } from "../components/inputStyles"
import { useAuth } from "../contexts/authContext"
import { useToast } from "../components/toastContext"

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

export function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passRef = useRef<HTMLInputElement>(null)

  function validate(): boolean {
    const next: typeof fieldErrors = {}
    if (!email.trim()) next.email = "Ingresá tu email"
    else if (!isValidEmail(email.trim())) next.email = "Email inválido"
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
    setSubmitted(true)
    if (!validate()) return
    setLoading(true)
    try {
      await login(email.trim(), password)
      toast.success("Sesión iniciada")
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
        <div className="mb-2">
          <Field label="Email" id="login-email" error={emailInvalid ? fieldErrors.email : undefined}>
            <input
              ref={emailRef}
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (submitted && fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }))
                if (error) setError("")
              }}
              onBlur={() => {
                if (submitted) validate()
              }}
              required
              aria-invalid={emailInvalid}
              aria-describedby={emailInvalid ? "login-email-error" : undefined}
              className={inputClassName(emailInvalid)}
            />
          </Field>
        </div>
        <div className="mb-2.5">
          <Field
            label="Contraseña"
            id="login-pass"
            error={passInvalid ? fieldErrors.password : undefined}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPass}
                className="absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            }
          >
            <input
              ref={passRef}
              id="login-pass"
              name="password"
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (submitted && fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }))
                if (error) setError("")
              }}
              required
              aria-invalid={passInvalid}
              aria-describedby={passInvalid ? "login-pass-error" : undefined}
              className={inputClassName(passInvalid)}
            />
          </Field>
        </div>
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className={`w-full justify-center ${buttonClassName("primary")}`}
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p className="mt-2.5 text-center text-xs text-zinc-400">
          ¿Sin cuenta?{" "}
          <Link to="/register" className="font-medium text-amber-500 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            Registrate
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}

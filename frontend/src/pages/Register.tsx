import { useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { ApiError } from "../api/client"
import { AuthCard } from "../components/AuthCard"
import { Field } from "../components/Field"
import { inputClassName } from "../components/inputStyles"
import { useAuth } from "../contexts/authContext"
import { useToast } from "../components/toastContext"

function strength(password: string): { label: string; width: string; color: string } {
  if (password.length < 6) return { label: "Débil", width: "w-1/3", color: "bg-red-500" }
  const hasUpper = /[A-Z]/.test(password)
  const hasNum = /\d/.test(password)
  const hasSym = /[^A-Za-z0-9]/.test(password)
  const score = [hasUpper, hasNum, hasSym].filter(Boolean).length + (password.length >= 10 ? 1 : 0)
  if (score <= 1) return { label: "Débil", width: "w-1/3", color: "bg-red-500" }
  if (score === 2) return { label: "Media", width: "w-2/3", color: "bg-amber-500" }
  return { label: "Fuerte", width: "w-full", color: "bg-zinc-400" }
}

export function Register() {
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passRef = useRef<HTMLInputElement>(null)

  const pwStrength = useMemo(() => (password ? strength(password) : null), [password])

  function validate(): boolean {
    const next: typeof fieldErrors = {}
    if (!email.trim()) next.email = "Ingresá tu email"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Email inválido"
    if (!password) next.password = "Ingresá tu contraseña"
    else if (password.length < 6) next.password = "Mínimo 6 caracteres"
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
      await register(email.trim(), password)
      toast.success("Cuenta creada")
      navigate("/")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al registrarse")
    } finally {
      setLoading(false)
    }
  }

  const emailInvalid = !!fieldErrors.email
  const passInvalid = !!fieldErrors.password

  return (
    <AuthCard title="Crear cuenta">
      <form onSubmit={onSubmit} noValidate>
        {error && (
          <p role="alert" className="mb-2.5 rounded-md bg-red-950/50 px-2.5 py-1.5 text-xs text-red-400">
            {error}
          </p>
        )}
        <div className="mb-2">
          <Field label="Email" id="register-email" error={emailInvalid ? fieldErrors.email : undefined}>
            <input
              ref={emailRef}
              id="register-email"
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
              aria-describedby={emailInvalid ? "register-email-error" : undefined}
              className={inputClassName(emailInvalid)}
            />
          </Field>
        </div>
        <div className="mb-2.5">
          <Field
            label="Contraseña"
            id="register-pass"
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
              id="register-pass"
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }))
              }}
              required
              minLength={6}
              aria-invalid={passInvalid}
              aria-describedby={passInvalid ? "register-pass-error" : "register-pass-hint"}
              className={inputClassName(passInvalid)}
            />
          </Field>
          {!passInvalid && (
            <p id="register-pass-hint" className="mt-1 text-xs text-zinc-500">
              Mínimo 6 caracteres
            </p>
          )}
          {pwStrength && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-800">
                <div className={`h-full rounded-full transition-all ${pwStrength.color} ${pwStrength.width}`} />
              </div>
              <span className="text-xs text-zinc-500">{pwStrength.label}</span>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="motek-press inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-amber-500 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          {loading ? "Creando cuenta..." : "Registrarse"}
        </button>
        <p className="mt-2.5 text-center text-xs text-zinc-400">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-amber-500 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}

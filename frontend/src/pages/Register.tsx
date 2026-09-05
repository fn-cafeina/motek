import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router"
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react"
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

type PwReq = { label: string; ok: boolean }
function pwRequirements(password: string): PwReq[] {
  return [
    { label: "Mínimo 6 caracteres", ok: password.length >= 6 },
    { label: "Al menos 8 para más seguridad", ok: password.length >= 8 },
    { label: "Una letra y un número", ok: /[A-Za-z]/.test(password) && /\d/.test(password) },
  ]
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
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passRef = useRef<HTMLInputElement>(null)

  function validate(): boolean {
    const next: typeof fieldErrors = {}
    if (!email.trim()) next.email = "Ingresá tu email"
    else if (!isValidEmail(email.trim())) next.email = "Email inválido"
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
    setSubmitted(true)
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
  const reqs = pwRequirements(password)
  const showReqs = password.length > 0

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
              name="password"
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
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
              aria-describedby={passInvalid ? "register-pass-error" : "register-pass-hint"}
              className={inputClassName(passInvalid)}
            />
          </Field>
          <ul id="register-pass-hint" className="mt-2 space-y-1" aria-live="polite">
            {reqs.map((r) => (
              <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? "text-emerald-400" : "text-zinc-500"}`}>
                {r.ok ? <Check className="h-3 w-3 shrink-0" aria-hidden /> : <X className="h-3 w-3 shrink-0" aria-hidden />}
                {r.label}
              </li>
            ))}
          </ul>
          {showReqs && !passInvalid && (
            <p className="sr-only" aria-live="polite">
              {reqs.filter((r) => r.ok).length} de {reqs.length} requisitos cumplidos
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className={`w-full justify-center ${buttonClassName("primary")}`}
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          {loading ? "Creando cuenta..." : "Registrarse"}
        </button>
        <p className="mt-2.5 text-center text-xs text-zinc-400">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="font-medium text-amber-500 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            Iniciá sesión
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}

import { useRef, useState } from "react"
import { Link, useNavigate } from "react-router"
import { Check, Eye, EyeOff, Loader2 } from "lucide-react"
import { ApiError } from "../api/client"
import { AuthCard } from "../components/AuthCard"
import { Field } from "../components/Field"
import { Alert } from "../components/ui/Alert"
import { buttonClassName } from "../components/buttonStyles"
import { inputClassName } from "../components/inputStyles"
import { useAuth } from "../contexts/authContext"
import { useToast } from "../components/toastContext"
import { isValidEmail } from "../lib/validate"

function pwHint(password: string): { label: string; ok: boolean } {
  return { label: "Mínimo 6 caracteres", ok: password.length >= 6 }
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
    else if (!isValidEmail(email)) next.email = "Email inválido"
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
  const hint = pwHint(password)

  return (
    <AuthCard title="Crear cuenta">
      <form onSubmit={onSubmit} noValidate>
        {error && (
          <div className="mb-2.5">
            <Alert tone="danger" live>{error}</Alert>
          </div>
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
                className="absolute inset-y-0 right-0 flex items-center px-2 text-subtle transition-colors hover:text-fg"
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
          <p
            id="register-pass-hint"
            className={`mt-1.5 flex items-center gap-1.5 text-[12px] ${hint.ok ? "text-ok" : "text-subtle"}`}
            aria-live="polite"
          >
            {hint.ok && <Check className="h-3 w-3 shrink-0" aria-hidden />}
            {hint.label}
          </p>
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
        <p className="mt-2.5 text-center text-[13px] text-muted">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}

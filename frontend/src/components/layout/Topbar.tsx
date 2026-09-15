import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { Bell, Moon, Sun } from "lucide-react"
import { useAuth } from "../../contexts/authContext"
import { useResumen } from "../../contexts/resumenContext"
import { useTheme } from "../../contexts/themeContext"
import { buttonClassName } from "../buttonStyles"
import { ConfirmDialog } from "../ConfirmDialog"
import { Brand } from "./Brand"

export function Topbar({ title }: { title: string }) {
  const { user, logout } = useAuth()
  const { resolved, toggle } = useTheme()
  const { stockCritico } = useResumen()
  const navigate = useNavigate()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const alertas = stockCritico.length

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-border bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="flex h-[var(--shell-header-h)] items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center">
          <div className="lg:hidden">
            <Brand />
          </div>
          <h1 className="hidden truncate text-[20px] font-semibold tracking-tight text-fg lg:block">{title}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Link
            to="/alertas"
            aria-label={alertas > 0 ? `Stock crítico: ${alertas} repuestos` : "Sin alertas de stock"}
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-fg"
          >
            <Bell className="h-[18px] w-[18px]" aria-hidden />
            {alertas > 0 && (
              <span
                className="absolute right-0 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-accent/25 bg-accent-soft px-1 text-[10px] font-semibold tabular-nums text-accent ring-2 ring-surface"
                aria-hidden
              >
                {alertas}
              </span>
            )}
          </Link>

          <button
            onClick={toggle}
            aria-label={resolved === "dark" ? "Usar tema claro" : "Usar tema oscuro"}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-fg"
          >
            {resolved === "dark" ? <Sun className="h-[18px] w-[18px]" aria-hidden /> : <Moon className="h-[18px] w-[18px]" aria-hidden />}
          </button>

          <span className="hidden max-w-40 truncate px-2 text-[13px] text-muted lg:block" title={user?.email}>
            {user?.email}
          </span>

          <button onClick={() => setConfirmLogout(true)} className={buttonClassName("secondary", "sm")}>
            Salir
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="¿Salir de Motek?"
        description={user ? `Cerrarás la sesión de ${user.email}.` : "Cerrarás tu sesión."}
        confirmLabel="Salir"
        variant="primary"
        onConfirm={() => {
          setConfirmLogout(false)
          handleLogout()
        }}
        onClose={() => setConfirmLogout(false)}
      />
    </header>
  )
}

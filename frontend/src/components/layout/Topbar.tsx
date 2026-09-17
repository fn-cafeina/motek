import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { Bell, LogOut } from "lucide-react"
import { useAuth } from "../../contexts/authContext"
import { useResumen } from "../../contexts/resumenContext"
import { useTheme } from "../../contexts/themeContext"
import { ConfirmDialog } from "../ConfirmDialog"
import { Menu, MenuGroup, MenuItem, MenuRadioItem, MenuSeparator } from "../ui/Menu"

export function Topbar({ title }: { title: string }) {
  const { user, logout } = useAuth()
  const { theme, resolved, setTheme } = useTheme()
  const { stockCritico } = useResumen()
  const navigate = useNavigate()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const alertas = stockCritico.length
  const email = user?.email ?? ""
  const inicial = email.charAt(0).toUpperCase() || "?"

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-border bg-surface pt-[env(safe-area-inset-top)]">
      <div className="flex h-[var(--shell-header-h)] items-center justify-between gap-3 px-4 lg:px-6">
        <h1
          id="page-title"
          className="motek-heading min-w-0 truncate text-[20px] font-semibold tracking-tight text-fg"
        >
          {title}
        </h1>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            to="/alertas"
            aria-label={alertas > 0 ? `Stock crítico: ${alertas} repuestos` : "Sin alertas de stock"}
            className="relative flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-fg"
          >
            <Bell className="size-5" aria-hidden />
            {alertas > 0 && (
              <span
                className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-md border border-accent/25 bg-accent-soft px-1 text-[11px] font-semibold leading-4 tabular-nums text-accent ring-2 ring-surface"
                aria-hidden
              >
                {alertas}
              </span>
            )}
          </Link>

          <Menu
            label="Cuenta"
            trigger={
              <span className="flex size-7 items-center justify-center rounded-md bg-primary-soft text-[12px] font-semibold text-primary">
                {inicial}
              </span>
            }
          >
            <div role="presentation" className="px-2 py-1.5">
              <p className="truncate text-[12px] text-muted" title={email}>
                {email || "Sin sesión"}
              </p>
            </div>

            <MenuSeparator />

            <MenuGroup label="Tema">
              <MenuRadioItem selected={theme === "light"} onClick={() => setTheme("light")}>
                Claro
              </MenuRadioItem>
              <MenuRadioItem selected={theme === "dark"} onClick={() => setTheme("dark")}>
                Oscuro
              </MenuRadioItem>
              <MenuRadioItem selected={theme === "system"} onClick={() => setTheme("system")}>
                Según el sistema{theme === "system" ? ` (${resolved === "dark" ? "oscuro" : "claro"})` : ""}
              </MenuRadioItem>
            </MenuGroup>

            <MenuSeparator />

            <MenuItem tone="danger" onClick={() => setConfirmLogout(true)}>
              <LogOut className="size-4" aria-hidden /> Cerrar sesión
            </MenuItem>
          </Menu>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="¿Cerrar sesión?"
        description={email ? `Se va a cerrar la sesión de ${email}.` : "Se va a cerrar la sesión."}
        confirmLabel="Cerrar sesión"
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

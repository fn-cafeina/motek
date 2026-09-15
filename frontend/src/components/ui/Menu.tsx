import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react"

const ITEMS = '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]'

function itemsOf(panel: HTMLElement | null): HTMLElement[] {
  if (!panel) return []
  return Array.from(panel.querySelectorAll<HTMLElement>(ITEMS))
}

type MenuProps = {
  /** Nombre accesible del disparador y del panel. */
  label: string
  trigger: ReactNode
  children: ReactNode
  triggerClassName?: string
  panelClassName?: string
  align?: "start" | "end"
}

/**
 * Menú desplegable. No es modal: no bloquea el scroll ni atrapa el foco como un
 * diálogo, pero sí cierra con Escape, con un clic afuera y devuelve el foco al
 * disparador cuando corresponde.
 */
export function Menu({
  label,
  trigger,
  children,
  triggerClassName = "flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-fg",
  panelClassName = "",
  align = "end",
}: MenuProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return

    function onMouseDown(event: MouseEvent) {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation()
        close(true)
        return
      }
      if (event.key === "Tab") {
        setOpen(false)
        return
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return

      const items = itemsOf(panelRef.current)
      if (items.length === 0) return
      event.preventDefault()
      const current = items.indexOf(document.activeElement as HTMLElement)
      let next = 0
      if (event.key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % items.length
      else if (event.key === "ArrowUp") next = current <= 0 ? items.length - 1 : current - 1
      else if (event.key === "End") next = items.length - 1
      items[next].focus()
    }

    document.addEventListener("mousedown", onMouseDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onMouseDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, close])

  // Al abrir, el foco entra al primer ítem para poder recorrerlo con las flechas.
  useEffect(() => {
    if (!open) return
    itemsOf(panelRef.current)[0]?.focus()
  }, [open])

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className={triggerClassName}
      >
        {trigger}
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="menu"
          aria-label={label}
          onClick={() => close(true)}
          className={`absolute top-full z-[var(--z-dialog)] mt-2 min-w-56 rounded-lg border border-border bg-surface p-1 shadow-lg ${
            align === "end" ? "right-0" : "left-0"
          } ${panelClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}

const ITEM_BASE =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors disabled:opacity-50"

const ITEM_TONES = {
  default: "text-fg hover:bg-raised",
  danger: "text-danger hover:bg-danger-soft",
} as const

export function MenuItem({
  children,
  onClick,
  tone = "default",
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  tone?: keyof typeof ITEM_TONES
  disabled?: boolean
}) {
  return (
    <button type="button" role="menuitem" onClick={onClick} disabled={disabled} className={`${ITEM_BASE} ${ITEM_TONES[tone]}`}>
      {children}
    </button>
  )
}

export function MenuRadioItem({
  children,
  selected,
  onClick,
}: {
  children: ReactNode
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onClick}
      className={`${ITEM_BASE} ${selected ? "font-medium text-primary" : "text-fg hover:bg-raised"}`}
    >
      <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden>
        {selected && <span className="size-2 rounded-full bg-current" />}
      </span>
      {children}
    </button>
  )
}

export function MenuGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      {children}
    </div>
  )
}

export function MenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-border" />
}

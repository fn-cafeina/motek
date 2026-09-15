import { useEffect, useRef, type RefObject } from "react"

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Pila de overlays abiertos. Solo el último responde a Escape y atrapa el tabulador,
// así un diálogo abierto encima de un panel lateral no cierra también el panel.
const openStack: symbol[] = []

/**
 * Comportamiento compartido por Dialog y Drawer: foco inicial, trampa de tabulación,
 * cierre con Escape, bloqueo del scroll de fondo y devolución del foco al disparador.
 */
export function useOverlayBehavior({
  open,
  onClose,
  dismissible = true,
  panelRef,
}: {
  open: boolean
  onClose: () => void
  dismissible?: boolean
  panelRef: RefObject<HTMLElement | null>
}) {
  const restoreRef = useRef<HTMLElement | null>(null)
  const tokenRef = useRef<symbol | null>(null)

  useEffect(() => {
    if (!open) return
    const token = Symbol("overlay")
    tokenRef.current = token
    openStack.push(token)

    restoreRef.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? panel)?.focus()

    return () => {
      const index = openStack.indexOf(token)
      if (index >= 0) openStack.splice(index, 1)
      tokenRef.current = null
      restoreRef.current?.focus()
    }
  }, [open, panelRef])

  useEffect(() => {
    if (!open) return
    const locksScroll = openStack.length === 1

    function onKeyDown(event: KeyboardEvent) {
      const token = tokenRef.current
      const isTopmost = openStack[openStack.length - 1] === token
      if (!isTopmost) return

      if (event.key === "Escape") {
        if (!dismissible) return
        event.stopPropagation()
        onClose()
        return
      }

      if (event.key !== "Tab") return
      const panel = panelRef.current
      if (!panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null,
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    if (locksScroll) document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)
    return () => {
      if (locksScroll) document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onClose, dismissible, panelRef])
}

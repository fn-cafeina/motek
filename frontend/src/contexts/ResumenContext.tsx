import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router"
import { api, MUTATED_EVENT } from "../api/client"
import type { AlertaStock, Cliente, Factura, OrdenTrabajo } from "../api/types"
import { getErrorMessage } from "../lib/errors"
import { ResumenContext } from "./resumenContext"

// Una sola fuente para los contadores del shell y los KPIs del tablero: se piden las
// colecciones una vez por navegación en vez de una vez por componente.
export function ResumenProvider({ children }: { children: React.ReactNode }) {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [stockCritico, setStockCritico] = useState<AlertaStock[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { pathname } = useLocation()

  const refresh = useCallback(async () => {
    try {
      const [ordenesData, facturasData, alertasData, clientesData] = await Promise.all([
        api<OrdenTrabajo[]>("/api/ordenes"),
        api<Factura[]>("/api/facturas"),
        api<AlertaStock[]>("/api/alertas/stock"),
        api<Cliente[]>("/api/clientes"),
      ])
      setOrdenes(ordenesData ?? [])
      setFacturas(facturasData ?? [])
      setStockCritico(alertasData ?? [])
      setClientes(clientesData ?? [])
      setError(null)
    } catch (e) {
      setError(getErrorMessage(e, "Error cargando el resumen"))
    } finally {
      setLoading(false)
    }
  }, [])

  // Se refresca al navegar para que los contadores no queden viejos después de
  // crear una orden o cobrar una factura. El setState llega después del await, no
  // en el render, así que la regla de efectos sincrónicos no aplica acá.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void refresh()
  }, [refresh, pathname])

  // Cualquier escritura a la API encola un refresco, así el contador de la barra
  // lateral se mueve sin tener que cambiar de pantalla.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const onMutated = () => {
      clearTimeout(timer)
      timer = setTimeout(() => void refresh(), 250)
    }
    window.addEventListener(MUTATED_EVENT, onMutated)
    return () => {
      clearTimeout(timer)
      window.removeEventListener(MUTATED_EVENT, onMutated)
    }
  }, [refresh])

  const value = useMemo(
    () => ({ ordenes, facturas, stockCritico, clientes, loading, error, refresh }),
    [ordenes, facturas, stockCritico, clientes, loading, error, refresh],
  )

  return <ResumenContext.Provider value={value}>{children}</ResumenContext.Provider>
}

import { createContext, useContext } from "react"
import type { AlertaStock, Cliente, Factura, OrdenTrabajo } from "../api/types"

export type ResumenContextValue = {
  ordenes: OrdenTrabajo[]
  facturas: Factura[]
  stockCritico: AlertaStock[]
  clientes: Cliente[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export const ResumenContext = createContext<ResumenContextValue | null>(null)

export function useResumen(): ResumenContextValue {
  const context = useContext(ResumenContext)
  if (!context) throw new Error("useResumen debe usarse dentro de ResumenProvider")
  return context
}

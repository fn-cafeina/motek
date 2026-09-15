import type { Factura, OrdenTrabajo } from "../api/types"

export function ordenesActivas(ordenes: OrdenTrabajo[]): OrdenTrabajo[] {
  return ordenes.filter((orden) => orden.estado !== "entregado")
}

export function contarPorEstado(ordenes: OrdenTrabajo[]): Record<string, number> {
  return ordenes.reduce<Record<string, number>>((acc, orden) => {
    acc[orden.estado] = (acc[orden.estado] ?? 0) + 1
    return acc
  }, {})
}

/** Facturas emitidas en el mes en curso, sin contar las canceladas. */
export function facturadoDelMes(facturas: Factura[], referencia = new Date()): number {
  return facturas.filter((f) => f.estado !== "cancelada" && mismoMes(f.fecha_emision, referencia)).reduce(
    (total, f) => total + f.total,
    0,
  )
}

/**
 * Motivo de lo que se cobró a medias: la API no expone el monto pagado ni el saldo
 * por factura, así que se suman los totales de las pendientes y parciales.
 */
export function facturasSinCobrar(facturas: Factura[]): Factura[] {
  return facturas.filter((f) => f.estado === "pendiente" || f.estado === "parcial")
}

export function totalSinCobrar(facturas: Factura[]): number {
  return facturasSinCobrar(facturas).reduce((total, f) => total + f.total, 0)
}

export function ordenesRecientes(ordenes: OrdenTrabajo[], limite = 8): OrdenTrabajo[] {
  return [...ordenes].sort((a, b) => b.id - a.id).slice(0, limite)
}

function mismoMes(iso: string, referencia: Date): boolean {
  const fecha = new Date(iso)
  return fecha.getFullYear() === referencia.getFullYear() && fecha.getMonth() === referencia.getMonth()
}

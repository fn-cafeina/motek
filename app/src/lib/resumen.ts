import type { Factura, OrdenTrabajo } from "./types";

export function ordenesActivas(ordenes: OrdenTrabajo[]): OrdenTrabajo[] {
  return ordenes.filter((orden) => orden.estado !== "entregado");
}

export function contarPorEstado(ordenes: OrdenTrabajo[]): Record<string, number> {
  return ordenes.reduce<Record<string, number>>((acc, orden) => {
    acc[orden.estado] = (acc[orden.estado] ?? 0) + 1;
    return acc;
  }, {});
}

export function facturasSinCobrar(facturas: Factura[]): Factura[] {
  return facturas.filter((factura) => factura.estado === "pendiente" || factura.estado === "parcial");
}

export function facturadoDelMes(facturas: Factura[], referencia = new Date()): number {
  return facturas
    .filter((factura) => factura.estado !== "cancelada" && mismoMes(factura.fecha_emision, referencia))
    .reduce((total, factura) => total + factura.total, 0);
}

export function totalSinCobrar(facturas: Factura[]): number {
  return facturasSinCobrar(facturas).reduce((total, factura) => total + factura.total, 0);
}

export function ordenesRecientes(ordenes: OrdenTrabajo[], limite = 8): OrdenTrabajo[] {
  return [...ordenes].sort((a, b) => b.id - a.id).slice(0, limite);
}

function mismoMes(iso: string, referencia: Date): boolean {
  const fecha = new Date(iso);
  return fecha.getFullYear() === referencia.getFullYear() && fecha.getMonth() === referencia.getMonth();
}

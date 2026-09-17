import { Link } from "react-router"
import { ClipboardList } from "lucide-react"
import { ORDEN_ESTADOS } from "../api/types"
import { EstadoBadge } from "../components/Badge"
import { Card } from "../components/Card"
import { PageStack } from "../components/layout/PageStack"
import { Alert } from "../components/ui/Alert"
import { buttonClassName } from "../components/buttonStyles"
import { EmptyState } from "../components/ui/EmptyState"
import { StatSkeleton } from "../components/ui/Skeleton"
import { StatCard } from "../components/ui/StatCard"
import { useResumen } from "../contexts/resumenContext"
import { buildMap, formatFecha, formatMoney } from "../lib/format"
import {
  contarPorEstado,
  facturadoDelMes,
  facturasSinCobrar,
  ordenesActivas,
  ordenesRecientes,
  totalSinCobrar,
} from "../lib/resumen"

const CHIP =
  "rounded-md border border-border bg-raised px-1.5 py-0.5 text-[11px] font-medium text-muted transition-colors hover:border-border-strong hover:text-fg"

const ENLACE = "text-[13px] font-medium text-primary underline-offset-4 hover:underline"

export function Inicio() {
  const { ordenes, facturas, stockCritico, clientes, loading, error } = useResumen()

  if (loading) {
    return (
      <PageStack>
        <StatSkeleton />
      </PageStack>
    )
  }

  if (error) {
    return (
      <PageStack>
        <Alert tone="danger" live>
          {error}
        </Alert>
      </PageStack>
    )
  }

  const estados = contarPorEstado(ordenes)
  const activas = ordenesActivas(ordenes).length
  const sinCobrar = facturasSinCobrar(facturas)
  const recientes = ordenesRecientes(ordenes, 8)
  const clienteMap = buildMap(clientes)
  const sinMovimiento = ordenes.length === 0 && facturas.length === 0

  if (sinMovimiento) {
    return (
      <PageStack>
        <Card>
          <EmptyState
            icon={<ClipboardList className="h-5 w-5" />}
            title="Todavía no hay movimiento"
            description="Cargá un cliente y abrí la primera orden de trabajo: acá vas a ver el estado del taller, el stock crítico y lo facturado."
            action={
              <Link to="/clientes" className={buttonClassName("primary")}>
                Ir a clientes
              </Link>
            }
          />
        </Card>
      </PageStack>
    )
  }

  return (
    <PageStack>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Órdenes activas"
          value={activas}
          tone="primary"
          hint={activas === 0 ? "No queda nada pendiente en el taller" : undefined}
          footer={
            <div className="flex flex-wrap gap-1.5">
              {ORDEN_ESTADOS.filter((estado) => estado.value !== "entregado" && estados[estado.value]).map((estado) => (
                <Link key={estado.value} to={`/ordenes?estado=${estado.value}`} className={CHIP}>
                  {estado.label} {estados[estado.value]}
                </Link>
              ))}
            </div>
          }
        />

        <StatCard
          label="Stock crítico"
          value={stockCritico.length}
          tone={stockCritico.length > 0 ? "accent" : "neutral"}
          to="/alertas"
          hint={stockCritico.length > 0 ? "Repuestos en el mínimo o por debajo" : "Todo el stock está sobre el mínimo"}
        />

        <StatCard
          label="Facturado este mes"
          value={formatMoney(facturadoDelMes(facturas))}
          to="/facturas"
          hint="Sin contar las facturas canceladas"
        />

        <StatCard
          label="Facturado sin cobrar"
          value={formatMoney(totalSinCobrar(facturas))}
          tone={sinCobrar.length > 0 ? "accent" : "neutral"}
          to="/facturas"
          hint={`Se suman los totales de ${sinCobrar.length} ${
            sinCobrar.length === 1 ? "factura pendiente o parcial" : "facturas pendientes o parciales"
          }`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-[15px] font-semibold text-fg">Últimas órdenes</h2>
            <Link to="/ordenes" className={ENLACE}>
              Ver todas
            </Link>
          </header>
          {recientes.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-muted">No hay órdenes cargadas.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recientes.map((orden) => (
                <li key={orden.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-fg">{orden.descripcion}</p>
                    <p className="truncate text-[12px] text-muted">
                      {clienteMap.get(orden.cliente_id)?.nombre ?? "Sin cliente"} · {formatFecha(orden.fecha_recibido)}
                    </p>
                  </div>
                  <EstadoBadge estado={orden.estado} />
                  <span className="hidden w-24 shrink-0 text-right text-[13px] tabular-nums text-muted sm:block">
                    {formatMoney(orden.total_mano_obra)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-[15px] font-semibold text-fg">Repuestos bajo mínimo</h2>
            <Link to="/alertas" className={ENLACE}>
              Ver todo
            </Link>
          </header>
          {stockCritico.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-muted">
              Ningún repuesto está en el mínimo.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {stockCritico.slice(0, 6).map((alerta) => (
                <li key={alerta.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-fg">{alerta.nombre}</p>
                    <p className="motek-code truncate text-[12px] text-subtle">{alerta.codigo}</p>
                  </div>
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums text-accent">
                    {alerta.stock}
                  </span>
                  <span className="shrink-0 text-[12px] tabular-nums text-subtle">de {alerta.stock_minimo} mín.</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageStack>
  )
}

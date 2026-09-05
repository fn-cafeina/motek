import { useEffect, useMemo, useState } from "react"
import { Banknote, Ban, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { api, ApiError } from "../api/client"
import type { Factura, OrdenTrabajo, Pago } from "../api/types"
import { FACTURA_ESTADOS, facturaEstadoLabel, PAGO_METODOS } from "../api/types"
import { EstadoBadge } from "../components/Badge"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { Dialog } from "../components/Dialog"
import { Field } from "../components/Field"
import { inputClassName, selectClassName } from "../components/inputStyles"
import { DataCard, InlineError, PageHeader } from "../components/PageShell"
import { PageStack } from "../components/layout/PageStack"
import { MobileList, Table, Tbody, Th, Thead, Td, Tr } from "../components/ui/Table"
import { useToast } from "../components/toastContext"
import { buttonClassName } from "../components/buttonStyles"
import { formatFecha, formatMoney } from "../lib/format"

export function Facturas() {
  const toast = useToast()
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [estadoFiltro, setEstadoFiltro] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [ordenSel, setOrdenSel] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [detail, setDetail] = useState<Factura | null>(null)
  const [pagos, setPagos] = useState<Pago[]>([])
  const [pagosLoading, setPagosLoading] = useState(false)
  const [pagoMonto, setPagoMonto] = useState("")
  const [pagoMetodo, setPagoMetodo] = useState<string>("efectivo")
  const [pagoError, setPagoError] = useState<string | null>(null)
  const [pagoSaving, setPagoSaving] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Factura | null>(null)
  const [cancelSaving, setCancelSaving] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editNotas, setEditNotas] = useState("")
  const [editVenc, setEditVenc] = useState("")
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const facturasIds = useMemo(() => new Set(facturas.map((f) => f.orden_id)), [facturas])
  const ordenesSinFactura = useMemo(() => ordenes.filter((o) => !facturasIds.has(o.id)), [ordenes, facturasIds])

  async function fetchFacturas(estado?: string) {
    const url = estado ? `/api/facturas?estado=${encodeURIComponent(estado)}` : "/api/facturas"
    const data = await api<Factura[]>(url)
    setFacturas(data ?? [])
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      await fetchFacturas(estadoFiltro || undefined)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error cargando facturas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api<Factura[]>("/api/facturas")
        if (!cancelled) setFacturas(data ?? [])
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Error cargando facturas")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function openCreate() {
    setCreateOpen(true)
    setOrdenSel("")
    setCreateError(null)
    if (ordenes.length === 0) {
      try {
        const data = await api<OrdenTrabajo[]>("/api/ordenes")
        setOrdenes(data ?? [])
      } catch {
        setCreateError("Error cargando órdenes")
      }
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!ordenSel) {
      setCreateError("Seleccioná una orden")
      return
    }
    setCreateError(null)
    setCreating(true)
    try {
      await api<Factura>("/api/facturas", { method: "POST", body: { orden_id: Number(ordenSel) } })
      setCreateOpen(false)
      setOrdenSel("")
      toast.success("Factura creada")
      await fetchFacturas(estadoFiltro || undefined)
    } catch (e) {
      setCreateError(e instanceof ApiError ? e.message : "Error creando factura")
    } finally {
      setCreating(false)
    }
  }

  async function openDetail(f: Factura) {
    setDetail(f)
    setPagos([])
    setPagoMonto("")
    setPagoMetodo("efectivo")
    setPagoError(null)
    setPagosLoading(true)
    try {
      const data = await api<Pago[]>(`/api/facturas/${f.id}/pagos`)
      setPagos(data ?? [])
    } catch (e) {
      setPagoError(e instanceof ApiError ? e.message : "Error cargando pagos")
    } finally {
      setPagosLoading(false)
    }
  }

  const totalPagado = useMemo(() => pagos.reduce((acc, p) => acc + p.monto, 0), [pagos])
  const saldo = useMemo(() => (detail ? detail.total - totalPagado : 0), [detail, totalPagado])

  async function onAddPago(e: React.FormEvent) {
    e.preventDefault()
    if (!detail) return
    const monto = Number(pagoMonto)
    if (!monto || monto <= 0) {
      setPagoError("Ingresá un monto válido")
      return
    }
    if (monto > saldo) {
      setPagoError("El pago excede el saldo de la factura")
      return
    }
    setPagoError(null)
    setPagoSaving(true)
    try {
      await api(`/api/facturas/${detail.id}/pagos`, { method: "POST", body: { monto, metodo: pagoMetodo } })
      const [pagosData, facturasData] = await Promise.all([
        api<Pago[]>(`/api/facturas/${detail.id}/pagos`),
        api<Factura[]>("/api/facturas"),
      ])
      setPagos(pagosData ?? [])
      setFacturas(facturasData ?? [])
      const updated = (facturasData ?? []).find((x) => x.id === detail.id)
      if (updated) setDetail(updated)
      setPagoMonto("")
      toast.success("Pago registrado")
    } catch (e) {
      setPagoError(e instanceof ApiError ? e.message : "Error registrando pago")
    } finally {
      setPagoSaving(false)
    }
  }

  async function onRemovePago(p: Pago) {
    if (!detail) return
    try {
      await api(`/api/facturas/${detail.id}/pagos/${p.id}`, { method: "DELETE" })
      const [pagosData, facturasData] = await Promise.all([
        api<Pago[]>(`/api/facturas/${detail.id}/pagos`),
        api<Factura[]>("/api/facturas"),
      ])
      setPagos(pagosData ?? [])
      setFacturas(facturasData ?? [])
      const updated = (facturasData ?? []).find((x) => x.id === detail.id)
      if (updated) setDetail(updated)
      toast.success("Pago eliminado")
    } catch (e) {
      setPagoError(e instanceof ApiError ? e.message : "Error eliminando pago")
    }
  }

  async function onCancel() {
    if (!cancelTarget) return
    setCancelSaving(true)
    try {
      await api(`/api/facturas/${cancelTarget.id}/cancelar`, { method: "PATCH", body: {} })
      setCancelTarget(null)
      toast.success("Factura cancelada")
      await fetchFacturas(estadoFiltro || undefined)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error cancelando factura")
    } finally {
      setCancelSaving(false)
    }
  }

  const [editFactura, setEditFactura] = useState<Factura | null>(null)

  function openEdit(f: Factura) {
    setEditFactura(f)
    setDetail(f)
    setEditOpen(true)
    setEditNotas(f.notas)
    setEditVenc(f.fecha_vencimiento ? f.fecha_vencimiento.slice(0, 10) : "")
    setEditError(null)
  }

  async function onEdit(e: React.FormEvent) {
    e.preventDefault()
    const target = editFactura ?? detail
    if (!target) return
    setEditSaving(true)
    setEditError(null)
    try {
      await api(`/api/facturas/${target.id}`, {
        method: "PUT",
        body: {
          notas: editNotas,
          fecha_vencimiento: editVenc ? new Date(editVenc).toISOString() : null,
        },
      })
      setEditOpen(false)
      const updated = await api<Factura>(`/api/facturas/${target.id}`)
      setDetail(updated)
      toast.success("Factura actualizada")
      await fetchFacturas(estadoFiltro || undefined)
    } catch (e) {
      setEditError(e instanceof ApiError ? e.message : "Error actualizando factura")
    } finally {
      setEditSaving(false)
    }
  }

  return (
    <>
      <PageStack>
        <PageHeader
          title="Facturas"
          count={!loading && facturas.length > 0 ? facturas.length : undefined}
          action={
            <button onClick={openCreate} className={buttonClassName("primary")}>
              <Plus className="h-3.5 w-3.5" /> Nueva
            </button>
          }
        />

        {error && facturas.length > 0 && <InlineError message={error} />}

        <DataCard
          loading={loading}
          loadingText="Cargando facturas..."
          error={error}
          errorTitle="No se pudieron cargar las facturas"
          onRetry={load}
          empty={
            facturas.length === 0
              ? {
                  title: "Aún no hay facturas",
                  description: "Facturá una orden entregada para liquidar mano de obra y repuestos.",
                  action: (
                    <button onClick={openCreate} className={buttonClassName("primary")}>
                      <Plus className="h-3.5 w-3.5" /> Nueva factura
                    </button>
                  ),
                }
              : null
          }
          toolbar={
            !loading && facturas.length > 0 ? (
              <div className="w-full sm:max-w-xs">
                <select
                  value={estadoFiltro}
                  onChange={(e) => {
                    setEstadoFiltro(e.target.value)
                    void fetchFacturas(e.target.value || undefined)
                  }}
                  className={`w-full appearance-none text-xs ${selectClassName()} !border-zinc-800 !bg-zinc-900`}
                >
                  <option value="">Todos los estados</option>
                  {FACTURA_ESTADOS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            ) : undefined
          }
        >
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Factura</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Emisión</Th>
                  <Th className="w-24 text-right"></Th>
                </tr>
              </Thead>
              <Tbody>
                {facturas.map((f) => (
                  <Tr key={f.id}>
                    <Td>
                      <button onClick={() => openDetail(f)} className="font-medium text-zinc-100 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded">
                        #{f.id}
                      </button>
                      <div className="text-xs text-zinc-500">Orden #{f.orden_id}</div>
                    </Td>
                    <Td><EstadoBadge estado={facturaEstadoLabel(f.estado)} /></Td>
                    <Td className="text-right font-semibold text-zinc-100">{formatMoney(f.total)}</Td>
                    <Td className="text-zinc-400">{formatFecha(f.fecha_emision)}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetail(f)}
                          aria-label="Ver pagos"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-sky-400 hover:bg-sky-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          <Banknote className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(f)}
                          aria-label="Editar factura"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {f.estado !== "cancelada" && (
                          <button
                            onClick={() => setCancelTarget(f)}
                            aria-label="Cancelar factura"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-red-400 hover:bg-red-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <MobileList>
              {facturas.map((f) => (
                <li key={f.id} className="px-3 py-3">
                  <div className="flex items-center justify-between">
                    <button onClick={() => openDetail(f)} className="text-sm font-medium text-zinc-100 hover:text-amber-400">#{f.id}</button>
                    <span className="text-sm font-semibold text-zinc-100">{formatMoney(f.total)}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">Orden #{f.orden_id} · {formatFecha(f.fecha_emision)}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <EstadoBadge estado={facturaEstadoLabel(f.estado)} />
                    <div className="flex gap-1.5">
                      <button onClick={() => openDetail(f)} className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-sky-400"><Banknote className="h-3.5 w-3.5" /></button>
                      <button onClick={() => openEdit(f)} className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-zinc-300"><Pencil className="h-3.5 w-3.5" /></button>
                      {f.estado !== "cancelada" && (
                        <button onClick={() => setCancelTarget(f)} className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-red-400"><Ban className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </MobileList>
          </>
        </DataCard>
      </PageStack>

      <Dialog open={createOpen} title="Nueva factura" dismissible={!creating} onClose={() => setCreateOpen(false)}>
        <form onSubmit={onCreate} noValidate className="space-y-3">
          {createError && (
            <p role="alert" className="rounded-md bg-red-950/50 px-2.5 py-1.5 text-xs text-red-400">{createError}</p>
          )}
          <Field label="Orden de trabajo *" id="fac-orden">
            <select
              id="fac-orden"
              value={ordenSel}
              onChange={(e) => { setOrdenSel(e.target.value); if (createError) setCreateError(null) }}
              className={selectClassName(!!createError)}
            >
              <option value="">Seleccionar orden</option>
              {ordenesSinFactura.map((o) => (
                <option key={o.id} value={o.id}>#{o.id} · {o.descripcion}</option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
              className={buttonClassName("secondary")}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              aria-busy={creating}
              className={buttonClassName("primary")}
            >
              {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              Crear
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={!!detail}
        title={detail ? `Factura #${detail.id}` : "Factura"}
        onClose={() => setDetail(null)}
        maxWidth="max-w-2xl"
      >
        {detail && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <EstadoBadge estado={facturaEstadoLabel(detail.estado)} />
              <span className="text-xs text-zinc-500">Emisión: {formatFecha(detail.fecha_emision)}</span>
            </div>

            <div className="grid grid-cols-1 gap-2 rounded-lg border border-zinc-800 p-3 text-center sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">Mano de obra</p>
                <p className="text-sm font-medium text-zinc-100">{formatMoney(detail.subtotal_mano_obra)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">Repuestos</p>
                <p className="text-sm font-medium text-zinc-100">{formatMoney(detail.subtotal_repuestos)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">Total</p>
                <p className="text-sm font-semibold text-amber-400">{formatMoney(detail.total)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs font-medium tracking-wide text-zinc-400">Pagos</p>
              {detail.estado !== "cancelada" && (
                <span className="text-xs text-zinc-400">
                  Pagado: <span className="font-semibold text-emerald-400">{formatMoney(totalPagado)}</span>
                  {" · "}Saldo: <span className="font-semibold text-zinc-200">{formatMoney(saldo)}</span>
                </span>
              )}
            </div>

            {pagoError && (
              <p role="alert" className="rounded-md bg-red-950/50 px-2.5 py-1.5 text-xs text-red-400">{pagoError}</p>
            )}

            {pagosLoading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando pagos...
              </div>
            ) : pagos.length === 0 ? (
              <p className="py-3 text-center text-xs text-zinc-400">Sin pagos registrados.</p>
            ) : (
              <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
                {pagos.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div>
                      <div className="text-sm font-medium text-zinc-100">{formatMoney(p.monto)}</div>
                      <div className="text-xs text-zinc-500">{p.metodo} · {formatFecha(p.fecha)}</div>
                    </div>
                    <button
                      onClick={() => onRemovePago(p)}
                      aria-label="Eliminar pago"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-red-950/50 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {detail.estado !== "cancelada" && detail.estado !== "pagada" && (
              <form onSubmit={onAddPago} noValidate className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Field label="Monto" id="pago-monto">
                  <input
                    id="pago-monto"
                    value={pagoMonto}
                    inputMode="numeric"
                    onChange={(e) => { setPagoMonto(e.target.value); if (pagoError) setPagoError(null) }}
                    className={inputClassName(!!pagoError)}
                    placeholder={`Hasta ${formatMoney(saldo)}`}
                  />
                </Field>
                <Field label="Método" id="pago-metodo">
                  <select
                    id="pago-metodo"
                    value={pagoMetodo}
                    onChange={(e) => setPagoMetodo(e.target.value)}
                    className={selectClassName()}
                  >
                    {PAGO_METODOS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </Field>
                <div className="flex items-end pb-0.5">
                  <button
                    type="submit"
                    disabled={pagoSaving}
                    className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-amber-500 px-3 text-xs font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-50 sm:h-[36px] sm:w-auto"
                  >
                    {pagoSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                    Pagar
                  </button>
                </div>
              </form>
            )}

            <div className="flex justify-end border-t border-zinc-800 pt-2">
              <button
                onClick={() => openEdit(detail)}
                disabled={detail.estado === "cancelada"}
                className={buttonClassName("secondary")}
              >
                Editar notas / vencimiento
              </button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={editOpen} title="Editar factura" dismissible={!editSaving} onClose={() => setEditOpen(false)}>
        <form onSubmit={onEdit} noValidate className="space-y-3">
          {editError && (
            <p role="alert" className="rounded-md bg-red-950/50 px-2.5 py-1.5 text-xs text-red-400">{editError}</p>
          )}
          <Field label="Notas" id="fac-notas">
            <textarea
              id="fac-notas"
              value={editNotas}
              onChange={(e) => setEditNotas(e.target.value)}
              rows={3}
              className={inputClassName()}
            />
          </Field>
          <Field label="Fecha de vencimiento" id="fac-venc">
            <input
              id="fac-venc"
              type="date"
              value={editVenc}
              onChange={(e) => setEditVenc(e.target.value)}
              className={inputClassName()}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setEditOpen(false)} disabled={editSaving} className={buttonClassName("secondary")}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={editSaving}
              className={buttonClassName("primary")}
            >
              {editSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              Guardar
            </button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!cancelTarget}
        busy={cancelSaving}
        title="¿Cancelar factura?"
        description={cancelTarget ? `La factura #${cancelTarget.id} quedará cancelada de forma irreversible.` : undefined}
        confirmLabel="Cancelar factura"
        onConfirm={onCancel}
        onClose={() => !cancelSaving && setCancelTarget(null)}
      />
    </>
  )
}

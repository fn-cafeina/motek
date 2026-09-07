import { useCallback, useMemo, useState } from "react"
import { Banknote, Ban, Loader2, Plus } from "lucide-react"
import { api } from "../api/client"
import type { Factura, OrdenTrabajo, Pago } from "../api/types"
import { FACTURA_ESTADOS, PAGO_METODOS } from "../api/types"
import { EstadoBadge } from "../components/Badge"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { Dialog } from "../components/Dialog"
import { Field } from "../components/Field"
import { Alert } from "../components/ui/Alert"
import { Form, FormActions, FormGrid } from "../components/ui/Form"
import { FilterSelect } from "../components/ui/FilterSelect"
import { inputClassName, selectClassName } from "../components/inputStyles"
import { DataCard, InlineError, PageHeader } from "../components/PageShell"
import { PageStack } from "../components/layout/PageStack"
import { RowActions } from "../components/ui/RowActions"
import { MobileList, Table, Tbody, Th, Thead, Td, Tr } from "../components/ui/Table"
import { useToast } from "../components/toastContext"
import { buttonClassName } from "../components/buttonStyles"
import { useCollection } from "../hooks/useCollection"
import { getErrorMessage } from "../lib/errors"
import { formatFecha, formatMoney } from "../lib/format"

export function Facturas() {
  const toast = useToast()
  const [estadoFiltro, setEstadoFiltro] = useState("")
  const { items: facturas, loading, error, setError, refresh } = useCollection<Factura>(
    "/api/facturas",
    "Error cargando facturas",
    { estado: estadoFiltro || undefined },
  )
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

  const loadLookups = useCallback(async () => {
    try {
      const data = await api<OrdenTrabajo[]>("/api/ordenes")
      setOrdenes(data ?? [])
    } catch {
      setCreateError("Error cargando órdenes")
    }
  }, [])

  const reloadAll = useCallback(async () => {
    await Promise.all([refresh(), loadLookups()])
  }, [refresh, loadLookups])

  async function openCreate() {
    setCreateOpen(true)
    setOrdenSel("")
    setCreateError(null)
    if (ordenes.length === 0) {
      await loadLookups()
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
      await refresh()
    } catch (e) {
      setCreateError(getErrorMessage(e, "Error creando factura"))
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
      setPagoError(getErrorMessage(e, "Error cargando pagos"))
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
      const [pagosData, updated] = await Promise.all([
        api<Pago[]>(`/api/facturas/${detail.id}/pagos`),
        api<Factura>(`/api/facturas/${detail.id}`),
      ])
      setPagos(pagosData ?? [])
      setDetail(updated)
      setPagoMonto("")
      toast.success("Pago registrado")
      await refresh()
    } catch (e) {
      setPagoError(getErrorMessage(e, "Error registrando pago"))
    } finally {
      setPagoSaving(false)
    }
  }

  async function onRemovePago(p: Pago) {
    if (!detail) return
    try {
      await api(`/api/facturas/${detail.id}/pagos/${p.id}`, { method: "DELETE" })
      const [pagosData, updated] = await Promise.all([
        api<Pago[]>(`/api/facturas/${detail.id}/pagos`),
        api<Factura>(`/api/facturas/${detail.id}`),
      ])
      setPagos(pagosData ?? [])
      setDetail(updated)
      toast.success("Pago eliminado")
      await refresh()
    } catch (e) {
      setPagoError(getErrorMessage(e, "Error eliminando pago"))
    }
  }

  async function onCancel() {
    if (!cancelTarget) return
    setCancelSaving(true)
    try {
      await api(`/api/facturas/${cancelTarget.id}/cancelar`, { method: "PATCH", body: {} })
      setCancelTarget(null)
      toast.success("Factura cancelada")
      await refresh()
    } catch (e) {
      setError(getErrorMessage(e, "Error cancelando factura"))
    } finally {
      setCancelSaving(false)
    }
  }

  const [editFactura, setEditFactura] = useState<Factura | null>(null)

  function openEdit(f: Factura) {
    setEditFactura(f)
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
      setDetail((d) => (d && d.id === updated.id ? updated : d))
      toast.success("Factura actualizada")
      await refresh()
    } catch (e) {
      setEditError(getErrorMessage(e, "Error actualizando factura"))
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
              <Plus className="h-3.5 w-3.5" /> Nueva factura
            </button>
          }
        />

        {error && facturas.length > 0 && <InlineError message={error} />}

        <DataCard
          loading={loading}
          loadingText="Cargando facturas..."
          error={error}
          errorTitle="No se pudieron cargar las facturas"
          onRetry={reloadAll}
          empty={
            facturas.length === 0
              ? estadoFiltro
                ? {
                    title: "Sin resultados para ese estado",
                    description: "Probá con otro estado o limpiá el filtro.",
                    action: (
                      <button onClick={() => setEstadoFiltro("")} className={buttonClassName("secondary")}>
                        Limpiar filtros
                      </button>
                    ),
                  }
                : {
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
            <div className="w-full sm:max-w-xs">
              <FilterSelect
                value={estadoFiltro}
                onChange={(v) => setEstadoFiltro(v)}
                label="Filtrar facturas por estado"
                busy={loading}
                options={[{ value: "", label: "Todos los estados" }, ...FACTURA_ESTADOS.map((s) => ({ value: s.value, label: s.label }))]}
              />
            </div>
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
                    <Td><EstadoBadge estado={f.estado} /></Td>
                    <Td className="text-right font-semibold text-zinc-100">{formatMoney(f.total)}</Td>
                    <Td className="text-zinc-400">{formatFecha(f.fecha_emision)}</Td>
                    <Td>
                      <RowActions
                        actions={[
                          { onClick: () => openDetail(f), label: `Ver pagos de factura #${f.id}`, icon: <Banknote className="h-3.5 w-3.5" />, tone: "info" },
                          ...(f.estado !== "cancelada" ? [{ onClick: () => setCancelTarget(f), label: `Cancelar factura #${f.id}`, icon: <Ban className="h-3.5 w-3.5" />, tone: "danger" as const }] : []),
                        ]}
                        onEdit={() => openEdit(f)}
                        editLabel={`Editar factura #${f.id}`}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <MobileList>
              {facturas.map((f) => (
                <li key={f.id} className="min-w-0 px-3 py-3">
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <button onClick={() => openDetail(f)} className="text-sm font-medium text-zinc-100 hover:text-amber-400">#{f.id}</button>
                    <span className="text-sm font-semibold text-zinc-100">{formatMoney(f.total)}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">Orden #{f.orden_id} · {formatFecha(f.fecha_emision)}</div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <EstadoBadge estado={f.estado} />
                    <RowActions
                      variant="card"
                      actions={[
                        { onClick: () => openDetail(f), label: `Ver pagos de factura #${f.id}`, icon: <Banknote className="h-3.5 w-3.5" />, tone: "info" },
                        ...(f.estado !== "cancelada" ? [{ onClick: () => setCancelTarget(f), label: `Cancelar factura #${f.id}`, icon: <Ban className="h-3.5 w-3.5" />, tone: "danger" as const }] : []),
                      ]}
                      onEdit={() => openEdit(f)}
                      editLabel={`Editar factura #${f.id}`}
                    />
                  </div>
                </li>
              ))}
            </MobileList>
          </>
        </DataCard>
      </PageStack>

      <Dialog open={createOpen} title="Nueva factura" dismissible={!creating} onClose={() => setCreateOpen(false)}>
        <Form onSubmit={onCreate}>
          {createError && <Alert>{createError}</Alert>}
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
          <FormActions>
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
          </FormActions>
        </Form>
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
              <EstadoBadge estado={detail.estado} />
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

            {pagoError && <Alert>{pagoError}</Alert>}

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
                    <RowActions
                      onDelete={() => onRemovePago(p)}
                      deleteLabel={`Eliminar pago de ${formatMoney(p.monto)}`}
                    />
                  </li>
                ))}
              </ul>
            )}

            {detail.estado !== "cancelada" && detail.estado !== "pagada" && (
              <Form onSubmit={onAddPago}>
                <FormGrid cols={3}>
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
                      className={buttonClassName("primary")}
                    >
                      {pagoSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                      Pagar
                    </button>
                  </div>
                </FormGrid>
              </Form>
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
        <Form onSubmit={onEdit}>
          {editError && <Alert>{editError}</Alert>}
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
          <FormActions>
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
          </FormActions>
        </Form>
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

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router"
import { Loader2, PackagePlus, Pencil, Plus, Trash2 } from "lucide-react"
import { api } from "../api/client"
import type { Cliente, Moto, OrdenEstado, OrdenRepuesto, OrdenTrabajo, Repuesto } from "../api/types"
import { ORDEN_ESTADOS } from "../api/types"
import { EstadoBadge } from "../components/Badge"
import { badgeToneClassName, estadoTone } from "../components/badgeTones"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { Dialog } from "../components/Dialog"
import { Field } from "../components/Field"
import { Alert } from "../components/ui/Alert"
import { Drawer } from "../components/ui/Drawer"
import { Form, FormActions, FormGrid } from "../components/ui/Form"
import { FilterBar } from "../components/ui/FilterBar"
import { FilterSelect } from "../components/ui/FilterSelect"
import { estadoSelectClassName, inputClassName, selectClassName } from "../components/inputStyles"
import { DataCard, InlineError, PageHeader } from "../components/PageShell"
import { PageStack } from "../components/layout/PageStack"
import { RowActions } from "../components/ui/RowActions"
import { MobileList, Table, Tbody, Th, Thead, Td, Tr } from "../components/ui/Table"
import { useToast } from "../components/toastContext"
import { buttonClassName } from "../components/buttonStyles"
import { useCollection } from "../hooks/useCollection"
import { getErrorMessage } from "../lib/errors"
import { numberField, required } from "../lib/validate"
import { buildMap, formatFecha, formatMoney } from "../lib/format"

type FormState = {
  cliente_id: string
  moto_id: string
  descripcion: string
  diagnostico: string
  total_mano_obra: string
  notas: string
}

const emptyForm: FormState = {
  cliente_id: "",
  moto_id: "",
  descripcion: "",
  diagnostico: "",
  total_mano_obra: "",
  notas: "",
}

export function Ordenes() {
  const toast = useToast()
  // El filtro vive en la URL para que el tablero pueda enlazar a una vista filtrada.
  const [searchParams, setSearchParams] = useSearchParams()
  const estadoFiltro = searchParams.get("estado") ?? ""
  const setEstadoFiltro = useCallback(
    (value: string) => setSearchParams(value ? { estado: value } : {}, { replace: true }),
    [setSearchParams],
  )
  const { items: ordenes, loading, error, setError, refresh } = useCollection<OrdenTrabajo>(
    "/api/ordenes",
    "Error cargando órdenes",
    { estado: estadoFiltro || undefined },
  )
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [motos, setMotos] = useState<Moto[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<OrdenTrabajo | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<{ descripcion?: string; cliente?: string; moto?: string; total_mano_obra?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<OrdenTrabajo | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [detail, setDetail] = useState<OrdenTrabajo | null>(null)
  const [repuestos, setRepuestos] = useState<OrdenRepuesto[]>([])
  const [allRepuestos, setAllRepuestos] = useState<Repuesto[]>([])
  const [addRepId, setAddRepId] = useState("")
  const [addRepCant, setAddRepCant] = useState("1")
  const [repError, setRepError] = useState<string | null>(null)
  const [repLoading, setRepLoading] = useState(false)
  const [repSaving, setRepSaving] = useState(false)
  const [estadoUpdatingId, setEstadoUpdatingId] = useState<number | null>(null)

  const clienteMap = useMemo(() => buildMap(clientes), [clientes])
  const motoMap = useMemo(() => buildMap(motos), [motos])
  const repuestoMap = useMemo(() => buildMap(allRepuestos), [allRepuestos])

  const loadLookups = useCallback(async () => {
    try {
      const [cs, motosData] = await Promise.all([
        api<Cliente[]>("/api/clientes"),
        api<Moto[]>("/api/motos"),
      ])
      setClientes(cs ?? [])
      setMotos((motosData as Moto[]) ?? [])
    } catch (e) {
      setError(getErrorMessage(e, "Error cargando órdenes"))
    }
  }, [setError])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cs, motosData] = await Promise.all([
          api<Cliente[]>("/api/clientes"),
          api<Moto[]>("/api/motos"),
        ])
        if (!cancelled) {
          setClientes(cs ?? [])
          setMotos((motosData as Moto[]) ?? [])
        }
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e, "Error cargando órdenes"))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setError])

  const reloadAll = useCallback(async () => {
    await Promise.all([refresh(), loadLookups()])
  }, [refresh, loadLookups])

  const motosDeCliente = useMemo(() => {
    if (!form.cliente_id) return []
    return motos.filter((m) => String(m.cliente_id) === form.cliente_id)
  }, [motos, form.cliente_id])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFieldErrors({})
    setFormError(null)
    setDialogOpen(true)
  }

  function openEdit(o: OrdenTrabajo) {
    setEditing(o)
    setForm({
      cliente_id: String(o.cliente_id),
      moto_id: String(o.moto_id),
      descripcion: o.descripcion,
      diagnostico: o.diagnostico,
      total_mano_obra: o.total_mano_obra ? String(o.total_mano_obra) : "",
      notas: o.notas,
    })
    setFieldErrors({})
    setFormError(null)
    setDialogOpen(true)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof fieldErrors = {}
    const descError = required(form.descripcion, "Descripción es requerida")
    if (descError) next.descripcion = descError
    if (!editing) {
      if (!form.cliente_id) next.cliente = "Seleccioná un cliente"
      if (!form.moto_id) next.moto = "Seleccioná una moto"
    }
    const moError = numberField(form.total_mano_obra, { label: "Total mano de obra" })
    if (moError) next.total_mano_obra = moError
    setFieldErrors(next)
    if (next.descripcion || next.cliente || next.moto || next.total_mano_obra) return
    setFormError(null)
    setSaving(true)
    const isEdit = !!editing
    try {
      if (editing) {
        await api(`/api/ordenes/${editing.id}`, {
          method: "PUT",
          body: {
            descripcion: form.descripcion.trim(),
            diagnostico: form.diagnostico,
            total_mano_obra: form.total_mano_obra ? Number(form.total_mano_obra) : 0,
            notas: form.notas,
          },
        })
      } else {
        await api("/api/ordenes", {
          method: "POST",
          body: {
            cliente_id: Number(form.cliente_id),
            moto_id: Number(form.moto_id),
            descripcion: form.descripcion.trim(),
            diagnostico: form.diagnostico,
            total_mano_obra: form.total_mano_obra ? Number(form.total_mano_obra) : 0,
            notas: form.notas,
          },
        })
      }
      setDialogOpen(false)
      setEditing(null)
      toast.success(isEdit ? "Orden actualizada" : "Orden creada")
      await refresh()
    } catch (e) {
      setFormError(getErrorMessage(e, "Error guardando orden"))
    } finally {
      setSaving(false)
    }
  }

  async function onChangeEstado(o: OrdenTrabajo, estado: OrdenEstado) {
    setEstadoUpdatingId(o.id)
    setError(null)
    try {
      await api(`/api/ordenes/${o.id}/estado`, { method: "PATCH", body: { estado } })
      toast.success("Estado actualizado")
      await refresh()
    } catch (e) {
      setError(getErrorMessage(e, "Error actualizando estado"))
    } finally {
      setEstadoUpdatingId(null)
    }
  }

  async function onDelete() {
    if (!confirm) return
    setDeleting(true)
    try {
      await api(`/api/ordenes/${confirm.id}`, { method: "DELETE" })
      setConfirm(null)
      toast.success("Orden eliminada")
      await refresh()
    } catch (e) {
      setError(getErrorMessage(e, "Error eliminando orden"))
    } finally {
      setDeleting(false)
    }
  }

  async function openDetail(o: OrdenTrabajo) {
    setDetail(o)
    setRepuestos([])
    setAllRepuestos([])
    setAddRepId("")
    setAddRepCant("1")
    setRepError(null)
    setRepLoading(true)
    try {
      const [or, reps] = await Promise.all([
        api<OrdenRepuesto[]>(`/api/ordenes/${o.id}/repuestos`),
        api<Repuesto[]>("/api/repuestos"),
      ])
      setRepuestos(or ?? [])
      setAllRepuestos(reps ?? [])
    } catch (e) {
      setRepError(getErrorMessage(e, "Error cargando repuestos de la orden"))
    } finally {
      setRepLoading(false)
    }
  }

  async function onAddRepuesto(e: React.FormEvent) {
    e.preventDefault()
    if (!detail || !addRepId) {
      setRepError("Seleccioná un repuesto")
      return
    }
    const cantidad = Number(addRepCant)
    if (!cantidad || cantidad <= 0) {
      setRepError("Cantidad inválida")
      return
    }
    setRepError(null)
    setRepSaving(true)
    try {
      await api(`/api/ordenes/${detail.id}/repuestos`, { method: "POST", body: { repuesto_id: Number(addRepId), cantidad } })
      const updated = await api<OrdenRepuesto[]>(`/api/ordenes/${detail.id}/repuestos`)
      setRepuestos(updated ?? [])
      setAddRepId("")
      setAddRepCant("1")
      toast.success("Repuesto agregado")
      await Promise.all([
        api<Repuesto[]>("/api/repuestos").then((r) => setAllRepuestos(r ?? [])),
      ])
    } catch (e) {
      setRepError(getErrorMessage(e, "Error agregando repuesto"))
    } finally {
      setRepSaving(false)
    }
  }

  async function onRemoveRepuesto(line: OrdenRepuesto) {
    if (!detail) return
    try {
      await api(`/api/ordenes/${detail.id}/repuestos/${line.repuesto_id}`, { method: "DELETE" })
      const updated = await api<OrdenRepuesto[]>(`/api/ordenes/${detail.id}/repuestos`)
      setRepuestos(updated ?? [])
      toast.success("Repuesto quitado")
      const reps = await api<Repuesto[]>("/api/repuestos")
      setAllRepuestos(reps ?? [])
    } catch (e) {
      setRepError(getErrorMessage(e, "Error quitando repuesto"))
    }
  }

  const totalRepuestos = useMemo(() => repuestos.reduce((acc, r) => acc + r.subtotal, 0), [repuestos])

  const disponible = (repId: string): number => {
    if (!repId) return 0
    const r = repuestoMap.get(Number(repId))
    return r ? r.stock : 0
  }

  return (
    <>
      <PageStack>
        <PageHeader title="Órdenes" />

        {error && ordenes.length > 0 && <InlineError message={error} />}

        <DataCard
          loading={loading}
          loadingText="Cargando órdenes"
          error={error}
          errorTitle="No se pudieron cargar las órdenes"
          onRetry={reloadAll}
          empty={
            ordenes.length === 0
              ? estadoFiltro
                ? {
                    title: "Sin resultados para ese estado",
                    description: "Probá con otro estado o limpiá el filtro para ver todas las órdenes.",
                    action: (
                      <button onClick={() => setEstadoFiltro("")} className={buttonClassName("secondary")}>
                        Limpiar filtro
                      </button>
                    ),
                  }
                : {
                    title: "Aún no hay órdenes",
                    description: "Abrí la ficha de un cliente, elegí su moto y detallá el trabajo a realizar.",
                  }
              : null
          }
          toolbar={
            <FilterBar>
              <div className="w-full sm:max-w-[13rem]">
                <FilterSelect
                  value={estadoFiltro}
                  onChange={setEstadoFiltro}
                  label="Filtrar órdenes por estado"
                  busy={loading}
                  options={[{ value: "", label: "Todos los estados" }, ...ORDEN_ESTADOS.map((e) => ({ value: e.value, label: e.label }))]}
                />
              </div>
              <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-end">
                {!loading && ordenes.length > 0 && (
                  <span className="whitespace-nowrap text-[12px] text-muted">
                    {ordenes.length} {ordenes.length === 1 ? "orden" : "órdenes"}
                  </span>
                )}
                <button onClick={openCreate} className={buttonClassName("primary")}>
                  <Plus className="h-4 w-4" aria-hidden /> Nueva orden
                </button>
              </div>
            </FilterBar>
          }
        >
          <>
            <Table caption="Órdenes de trabajo">
              <Thead>
                <tr>
                  <Th>Trabajo</Th>
                  <Th>Cliente</Th>
                  <Th>Moto</Th>
                  <Th>Estado</Th>
                  <Th align="right">M. obra</Th>
                  <Th className="w-28" align="right">
                    <span className="sr-only">Acciones</span>
                  </Th>
                </tr>
              </Thead>
              <Tbody>
                {ordenes.map((o) => {
                  const moto = motoMap.get(o.moto_id)
                  const cliente = clienteMap.get(o.cliente_id)
                  const actualizando = estadoUpdatingId === o.id
                  return (
                    <Tr key={o.id}>
                      <Td className="max-w-[220px]">
                        <button
                          onClick={() => openDetail(o)}
                          title={o.descripcion}
                          className="block max-w-full truncate text-left font-medium text-fg underline-offset-4 hover:text-primary hover:underline"
                        >
                          {o.descripcion}
                        </button>
                        <div className="text-[12px] text-subtle">{formatFecha(o.fecha_recibido)}</div>
                      </Td>
                      <Td className="text-muted">{cliente?.nombre ?? `#${o.cliente_id}`}</Td>
                      <Td className="text-muted">{moto ? `${moto.marca} ${moto.modelo}` : `#${o.moto_id}`}</Td>
                      <Td>
                        <select
                          value={o.estado}
                          onChange={(e) => onChangeEstado(o, e.target.value as OrdenEstado)}
                          disabled={actualizando}
                          aria-label={`Cambiar estado de ${o.descripcion}`}
                          aria-busy={actualizando}
                          className={`${estadoSelectClassName()} ${badgeToneClassName(estadoTone(o.estado))}`}
                        >
                          {ORDEN_ESTADOS.map((e) => (
                            <option key={e.value} value={e.value}>{e.label}</option>
                          ))}
                        </select>
                      </Td>
                      <Td align="right" className="text-muted">{formatMoney(o.total_mano_obra)}</Td>
                      <Td>
                        <RowActions
                          actions={[{ onClick: () => openDetail(o), label: `Ver repuestos de ${o.descripcion}`, icon: <PackagePlus className="h-3.5 w-3.5" />, tone: "info" }]}
                          onEdit={() => openEdit(o)}
                          editLabel={`Editar ${o.descripcion}`}
                          onDelete={() => setConfirm(o)}
                          deleteLabel={`Eliminar ${o.descripcion}`}
                        />
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
            <MobileList>
              {ordenes.map((o) => {
                const moto = motoMap.get(o.moto_id)
                const cliente = clienteMap.get(o.cliente_id)
                return (
                  <li key={o.id} className="min-w-0 px-4 py-3">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <button onClick={() => openDetail(o)} title={o.descripcion} className="block w-full truncate text-left text-[13px] font-medium text-fg">
                          {o.descripcion}
                        </button>
                        <div className="mt-0.5 truncate text-[12px] text-subtle">
                          {cliente?.nombre ?? `#${o.cliente_id}`} · {moto ? `${moto.marca} ${moto.modelo}` : `#${o.moto_id}`} · {formatFecha(o.fecha_recibido)}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-[13px] font-semibold tabular-nums text-fg">{formatMoney(o.total_mano_obra)}</div>
                    </div>
                    <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
                      <select
                        value={o.estado}
                        onChange={(e) => onChangeEstado(o, e.target.value as OrdenEstado)}
                        disabled={estadoUpdatingId === o.id}
                        aria-label={`Cambiar estado de ${o.descripcion}`}
                        aria-busy={estadoUpdatingId === o.id}
                        className={`${estadoSelectClassName()} max-w-[60%] ${badgeToneClassName(estadoTone(o.estado))}`}
                      >
                        {ORDEN_ESTADOS.map((e) => (
                          <option key={e.value} value={e.value}>{e.label}</option>
                        ))}
                      </select>
                      <RowActions
                        variant="card"
                        actions={[{ onClick: () => openDetail(o), label: `Ver repuestos de ${o.descripcion}`, icon: <PackagePlus className="h-3.5 w-3.5" />, tone: "info" }]}
                        onEdit={() => openEdit(o)}
                        editLabel={`Editar ${o.descripcion}`}
                        onDelete={() => setConfirm(o)}
                        deleteLabel={`Eliminar ${o.descripcion}`}
                      />
                    </div>
                  </li>
                )
              })}
            </MobileList>
          </>
        </DataCard>
      </PageStack>

      <Dialog open={dialogOpen} title={editing ? "Editar orden" : "Nueva orden"} dismissible={!saving} onClose={() => setDialogOpen(false)}>
        <Form onSubmit={onSubmit}>
          {formError && (
            <Alert tone="danger" live>
              {formError}
            </Alert>
          )}
          {!editing ? (
            <FormGrid>
              <Field label="Cliente *" id="ord-cliente" error={fieldErrors.cliente}>
                <select
                  id="ord-cliente"
                  value={form.cliente_id}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, cliente_id: e.target.value, moto_id: "" }))
                    if (fieldErrors.cliente) setFieldErrors((p) => ({ ...p, cliente: undefined }))
                  }}
                  required
                  aria-invalid={!!fieldErrors.cliente}
                  className={selectClassName(!!fieldErrors.cliente)}
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </Field>
              <Field label="Moto *" id="ord-moto" error={fieldErrors.moto}>
                <select
                  id="ord-moto"
                  value={form.moto_id}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, moto_id: e.target.value }))
                    if (fieldErrors.moto) setFieldErrors((p) => ({ ...p, moto: undefined }))
                  }}
                  required
                  disabled={!form.cliente_id}
                  aria-invalid={!!fieldErrors.moto}
                  className={selectClassName(!!fieldErrors.moto)}
                >
                  <option value="">Seleccionar moto</option>
                  {motosDeCliente.map((m) => (
                    <option key={m.id} value={m.id}>{m.marca} {m.modelo}{m.anio ? ` (${m.anio})` : ""}</option>
                  ))}
                </select>
                {!form.cliente_id && <p className="mt-1.5 text-[12px] text-subtle">Elegí un cliente para listar sus motos.</p>}
              </Field>
            </FormGrid>
          ) : (
            <div className="rounded-md bg-raised px-3 py-2 text-[13px] text-muted">
              Cliente: <span className="text-fg">{clienteMap.get(editing.cliente_id)?.nombre ?? `#${editing.cliente_id}`}</span>
              {" · "}Moto: <span className="text-fg">{(() => { const m = motoMap.get(editing.moto_id); return m ? `${m.marca} ${m.modelo}` : `#${editing.moto_id}` })()}</span>
            </div>
          )}
          <Field label="Descripción *" id="ord-descripcion" error={fieldErrors.descripcion}>
            <input
              id="ord-descripcion"
              value={form.descripcion}
              onChange={(e) => {
                setForm((p) => ({ ...p, descripcion: e.target.value }))
                if (fieldErrors.descripcion) setFieldErrors((p) => ({ ...p, descripcion: undefined }))
              }}
              aria-invalid={!!fieldErrors.descripcion}
              aria-describedby={fieldErrors.descripcion ? "ord-descripcion-error" : undefined}
              className={inputClassName(!!fieldErrors.descripcion)}
              placeholder="Cambio de aceite y filtros"
            />
          </Field>
          <Field label="Diagnóstico" id="ord-diagnostico">
            <textarea
              id="ord-diagnostico"
              value={form.diagnostico}
              onChange={(e) => setForm((p) => ({ ...p, diagnostico: e.target.value }))}
              rows={2}
              className={inputClassName()}
            />
          </Field>
          <FormGrid>
            <Field label="Total mano de obra" id="ord-mo" error={fieldErrors.total_mano_obra}>
              <input
                id="ord-mo"
                value={form.total_mano_obra}
                inputMode="numeric"
                onChange={(e) => {
                  setForm((p) => ({ ...p, total_mano_obra: e.target.value }))
                  if (fieldErrors.total_mano_obra) setFieldErrors((p) => ({ ...p, total_mano_obra: undefined }))
                }}
                aria-invalid={!!fieldErrors.total_mano_obra}
                className={inputClassName(!!fieldErrors.total_mano_obra)}
              />
            </Field>
            <Field label="Notas" id="ord-notas">
              <input
                id="ord-notas"
                value={form.notas}
                onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
                className={inputClassName()}
              />
            </Field>
          </FormGrid>
          <FormActions>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
              className={buttonClassName("secondary")}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving}
              className={buttonClassName("primary")}
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              {editing ? "Guardar" : "Crear"}
            </button>
          </FormActions>
        </Form>
      </Dialog>

      <Drawer
        open={!!detail}
        title={detail ? `Orden #${detail.id}` : "Orden"}
        onClose={() => setDetail(null)}
        footer={
          detail ? (
            <>
              <button
                onClick={() => {
                  const target = detail
                  setDetail(null)
                  setConfirm(target)
                }}
                className={buttonClassName("dangerGhost")}
              >
                <Trash2 className="h-4 w-4" aria-hidden /> Eliminar
              </button>
              <button
                onClick={() => {
                  const target = detail
                  setDetail(null)
                  openEdit(target)
                }}
                className={buttonClassName("secondary")}
              >
                <Pencil className="h-4 w-4" aria-hidden /> Editar
              </button>
            </>
          ) : undefined
        }
      >
        {detail && (
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <EstadoBadge estado={detail.estado} />
                <span className="text-[12px] text-subtle">Recibida el {formatFecha(detail.fecha_recibido)}</span>
              </div>
              <p className="mt-2 text-[15px] font-semibold leading-[1.35] text-fg">{detail.descripcion}</p>
            </div>

            <dl className="space-y-2 rounded-md border border-border bg-raised/60 px-3 py-3 text-[13px]">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">Cliente</dt>
                <dd className="min-w-0 truncate text-right text-fg">
                  {clienteMap.get(detail.cliente_id)?.nombre ?? `#${detail.cliente_id}`}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">Moto</dt>
                <dd className="min-w-0 truncate text-right text-fg">
                  {(() => {
                    const m = motoMap.get(detail.moto_id)
                    return m ? `${m.marca} ${m.modelo}${m.anio ? ` (${m.anio})` : ""}` : `#${detail.moto_id}`
                  })()}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted">Mano de obra</dt>
                <dd className="tabular-nums text-fg">{formatMoney(detail.total_mano_obra)}</dd>
              </div>
            </dl>

            {detail.diagnostico && (
              <div>
                <p className="mb-1 text-[12px] font-medium text-muted">Diagnóstico</p>
                <p className="motek-prose text-[13px] leading-[1.6] text-fg">{detail.diagnostico}</p>
              </div>
            )}

            {detail.notas && (
              <div>
                <p className="mb-1 text-[12px] font-medium text-muted">Notas</p>
                <p className="motek-prose text-[13px] leading-[1.6] text-fg">{detail.notas}</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-[13px] font-semibold text-fg">Repuestos</p>

              {repError && (
                <div className="mb-2">
                  <Alert tone="danger" live>
                    {repError}
                  </Alert>
                </div>
              )}

              {repLoading ? (
                <div role="status" className="flex items-center justify-center gap-2 py-6 text-[13px] text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Cargando repuestos
                </div>
              ) : repuestos.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-[13px] text-muted">
                  Sin repuestos en esta orden.
                </p>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
                  {repuestos.map((line) => {
                    const rep = repuestoMap.get(line.repuesto_id)
                    return (
                      <li key={line.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-fg">
                            {rep?.nombre || `#${line.repuesto_id}`}
                          </div>
                          <div className="text-[12px] tabular-nums text-subtle">
                            {line.cantidad} × {formatMoney(line.precio_unitario)}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <span className="text-[13px] font-semibold tabular-nums text-fg">{formatMoney(line.subtotal)}</span>
                          <RowActions
                            onDelete={() => onRemoveRepuesto(line)}
                            deleteLabel={`Quitar ${rep?.nombre || "repuesto"}`}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[13px] text-muted">Total repuestos</span>
                <span className="text-[15px] font-semibold tabular-nums text-fg">{formatMoney(totalRepuestos)}</span>
              </div>
            </div>

            <Form onSubmit={onAddRepuesto}>
              <FormGrid cols={3}>
                <Field label="Repuesto" id="add-rep">
                  <select
                    id="add-rep"
                    value={addRepId}
                    onChange={(e) => setAddRepId(e.target.value)}
                    className={selectClassName()}
                  >
                    <option value="">Seleccionar repuesto</option>
                    {allRepuestos.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre || r.codigo} · stock {r.stock}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Cantidad" id="add-cant">
                  <input
                    id="add-cant"
                    value={addRepCant}
                    inputMode="numeric"
                    onChange={(e) => setAddRepCant(e.target.value)}
                    className={inputClassName()}
                  />
                </Field>
                <div className="flex items-end pb-0.5">
                  <button type="submit" disabled={repSaving || !addRepId} className={buttonClassName("primary")}>
                    {repSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                    Agregar
                  </button>
                </div>
              </FormGrid>
              {addRepId && disponible(addRepId) <= 0 && (
                <Alert tone="accent">Sin stock disponible para este repuesto.</Alert>
              )}
            </Form>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirm}
        busy={deleting}
        title="¿Eliminar orden?"
        description={confirm ? `${confirm.descripcion} será eliminada.` : undefined}
        confirmLabel="Eliminar"
        onClose={() => !deleting && setConfirm(null)}
        onConfirm={onDelete}
      />
    </>
  )
}

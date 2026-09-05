import { useEffect, useMemo, useState } from "react"
import { Loader2, PackagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { api, ApiError } from "../api/client"
import type { Cliente, Moto, OrdenEstado, OrdenRepuesto, OrdenTrabajo, Repuesto } from "../api/types"
import { ORDEN_ESTADOS } from "../api/types"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { Dialog } from "../components/Dialog"
import { Field } from "../components/Field"
import { inputClassName, selectClassName } from "../components/inputStyles"
import { DataCard, InlineError, PageHeader } from "../components/PageShell"
import { useToast } from "../components/toastContext"
import { buttonClassName } from "../components/buttonStyles"
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
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [motos, setMotos] = useState<Moto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [estadoFiltro, setEstadoFiltro] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<OrdenTrabajo | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<OrdenTrabajo | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [detail, setDetail] = useState<OrdenTrabajo | null>(null)
  const [repuestos, setRepuestos] = useState<OrdenRepuesto[]>([])
  const [allRepuestos, setAllRepuestos] = useState<Repuesto[]>([])
  const [addRepId, setAddRepId] = useState("")
  const [addRepCant, setAddRepCant] = useState("1")
  const [repError, setRepError] = useState<string | null>(null)
  const [repSaving, setRepSaving] = useState(false)

  const clienteMap = useMemo(() => buildMap(clientes), [clientes])
  const motoMap = useMemo(() => buildMap(motos), [motos])
  const repuestoMap = useMemo(() => buildMap(allRepuestos), [allRepuestos])

  async function fetchOrdenes(estado?: string) {
    const url = estado ? `/api/ordenes?estado=${encodeURIComponent(estado)}` : "/api/ordenes"
    const data = await api<OrdenTrabajo[]>(url)
    setOrdenes(data ?? [])
  }

  async function fetchLookups() {
    const [cs, motosData] = await Promise.all([
      api<Cliente[]>("/api/clientes"),
      api<Moto[]>("/api/motos"),
    ])
    setClientes(cs ?? [])
    setMotos((motosData as Moto[]) ?? [])
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchOrdenes(estadoFiltro || undefined), fetchLookups()])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error cargando órdenes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [ordenesData, cs, motosData] = await Promise.all([
          api<OrdenTrabajo[]>("/api/ordenes"),
          api<Cliente[]>("/api/clientes"),
          api<Moto[]>("/api/motos"),
        ])
        if (!cancelled) {
          setOrdenes(ordenesData ?? [])
          setClientes(cs ?? [])
          setMotos((motosData as Moto[]) ?? [])
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Error cargando órdenes")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const motosDeCliente = useMemo(() => {
    if (!form.cliente_id) return []
    return motos.filter((m) => String(m.cliente_id) === form.cliente_id)
  }, [motos, form.cliente_id])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFieldError(null)
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
    setFieldError(null)
    setDialogOpen(true)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descripcion.trim()) {
      setFieldError("Descripción es requerida")
      return
    }
    setFieldError(null)
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
      await fetchOrdenes(estadoFiltro || undefined)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error guardando orden")
    } finally {
      setSaving(false)
    }
  }

  async function onChangeEstado(o: OrdenTrabajo, estado: OrdenEstado) {
    try {
      await api(`/api/ordenes/${o.id}/estado`, { method: "PATCH", body: { estado } })
      toast.success("Estado actualizado")
      await fetchOrdenes(estadoFiltro || undefined)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error actualizando estado")
    }
  }

  async function onDelete() {
    if (!confirm) return
    setDeleting(true)
    try {
      await api(`/api/ordenes/${confirm.id}`, { method: "DELETE" })
      setConfirm(null)
      toast.success("Orden eliminada")
      await fetchOrdenes(estadoFiltro || undefined)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error eliminando orden")
    } finally {
      setDeleting(false)
    }
  }

  async function openDetail(o: OrdenTrabajo) {
    setDetail(o)
    setRepuestos([])
    setAddRepId("")
    setAddRepCant("1")
    setRepError(null)
    const [or, reps] = await Promise.all([
      api<OrdenRepuesto[]>(`/api/ordenes/${o.id}/repuestos`),
      api<Repuesto[]>("/api/repuestos"),
    ])
    setRepuestos(or ?? [])
    setAllRepuestos(reps ?? [])
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
      setRepError(e instanceof ApiError ? e.message : "Error agregando repuesto")
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
      setRepError(e instanceof ApiError ? e.message : "Error quitando repuesto")
    }
  }

  const totalRepuestos = useMemo(() => repuestos.reduce((acc, r) => acc + r.subtotal, 0), [repuestos])
  const showSearch = !loading && ordenes.length > 0

  const disponible = (repId: string): number => {
    if (!repId) return 0
    const r = repuestoMap.get(Number(repId))
    return r ? r.stock : 0
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Órdenes"
        count={!loading && ordenes.length > 0 ? ordenes.length : undefined}
        action={
          <button onClick={openCreate} className={buttonClassName("primary")}>
            <Plus className="h-3.5 w-3.5" /> Nueva
          </button>
        }
      />

      {error && ordenes.length > 0 && <InlineError message={error} />}

      {showSearch && (
        <div className="relative sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <select
            value={estadoFiltro}
            onChange={(e) => {
              setEstadoFiltro(e.target.value)
              void fetchOrdenes(e.target.value || undefined)
            }}
            className={`w-full appearance-none pl-8 pr-3 text-xs ${selectClassName()} !border-zinc-800 !bg-zinc-900`}
          >
            <option value="">Todos los estados</option>
            {ORDEN_ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>
      )}

      <DataCard
        loading={loading}
        loadingText="Cargando órdenes..."
        error={error}
        errorTitle="No se pudieron cargar las órdenes"
        onRetry={load}
        empty={
          ordenes.length === 0
            ? {
                title: "Aún no hay órdenes",
                description: "Creá tu primera orden de trabajo.",
                action: (
                  <button onClick={openCreate} className={buttonClassName("primary")}>
                    <Plus className="h-3.5 w-3.5" /> Nueva orden
                  </button>
                ),
              }
            : null
        }
      >
        <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Listado</caption>
                <thead className="border-b border-zinc-800 text-zinc-400">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Descripción</th>
                    <th scope="col" className="px-3 py-2 font-medium">Cliente</th>
                    <th scope="col" className="px-3 py-2 font-medium">Moto</th>
                    <th scope="col" className="px-3 py-2 font-medium">Estado</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">M. obra</th>
                    <th scope="col" className="w-28 px-3 py-2 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {ordenes.map((o) => {
                    const moto = motoMap.get(o.moto_id)
                    const cliente = clienteMap.get(o.cliente_id)
                    return (
                      <tr key={o.id} className="transition-colors hover:bg-zinc-800/40">
                        <td className="max-w-[200px] px-3 py-2.5">
                          <button onClick={() => openDetail(o)} title={o.descripcion} className="block truncate text-left font-medium text-zinc-100 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded">
                            {o.descripcion}
                          </button>
                          <div className="text-xs text-zinc-400">{formatFecha(o.fecha_recibido)}</div>
                        </td>
                        <td className="px-3 py-2.5 text-zinc-300">{cliente?.nombre ?? `#${o.cliente_id}`}</td>
                        <td className="px-3 py-2.5 text-zinc-400">
                          {moto ? `${moto.marca} ${moto.modelo}` : `#${o.moto_id}`}
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            value={o.estado}
                            onChange={(e) => onChangeEstado(o, e.target.value as OrdenEstado)}
                            aria-label={`Cambiar estado de ${o.descripcion}`}
                            className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          >
                            {ORDEN_ESTADOS.map((e) => (
                              <option key={e.value} value={e.value}>{e.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5 text-right text-zinc-300">{formatMoney(o.total_mano_obra)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openDetail(o)}
                              aria-label="Ver repuestos"
                              className="flex h-8 w-8 items-center justify-center rounded-md text-sky-400 hover:bg-sky-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            >
                              <PackagePlus className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openEdit(o)}
                              aria-label={`Editar ${o.descripcion}`}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirm(o)}
                              aria-label={`Eliminar ${o.descripcion}`}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-red-950/50 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-zinc-800 sm:hidden">
              {ordenes.map((o) => {
                const moto = motoMap.get(o.moto_id)
                const cliente = clienteMap.get(o.cliente_id)
                return (
                  <li key={o.id} className="px-3 py-3">
                    <button onClick={() => openDetail(o)} title={o.descripcion} className="block text-left text-sm font-medium text-zinc-100 hover:text-amber-400">
                      {o.descripcion}
                    </button>
                    <div className="mt-0.5 truncate text-xs text-zinc-500">
                      {cliente?.nombre ?? `#${o.cliente_id}`} · {moto ? `${moto.marca} ${moto.modelo}` : `#${o.moto_id}`} · {formatMoney(o.total_mano_obra)}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <select
                        value={o.estado}
                        onChange={(e) => onChangeEstado(o, e.target.value as OrdenEstado)}
                        aria-label={`Cambiar estado`}
                        className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      >
                        {ORDEN_ESTADOS.map((e) => (
                          <option key={e.value} value={e.value}>{e.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-2 flex justify-end gap-1.5">
                      <button
                        onClick={() => openDetail(o)}
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-sky-400 hover:bg-sky-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      >
                        <PackagePlus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(o)}
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirm(o)}
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-zinc-400 hover:bg-red-950/50 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
      </DataCard>

      <Dialog open={dialogOpen} title={editing ? "Editar orden" : "Nueva orden"} onClose={() => setDialogOpen(false)}>
        <form onSubmit={onSubmit} noValidate className="space-y-3">
          {!editing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Cliente *" id="ord-cliente">
                <select
                  id="ord-cliente"
                  value={form.cliente_id}
                  onChange={(e) => setForm((p) => ({ ...p, cliente_id: e.target.value, moto_id: "" }))}
                  required
                  className={selectClassName()}
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </Field>
              <Field label="Moto *" id="ord-moto">
                <select
                  id="ord-moto"
                  value={form.moto_id}
                  onChange={(e) => setForm((p) => ({ ...p, moto_id: e.target.value }))}
                  required
                  disabled={!form.cliente_id}
                  className={selectClassName()}
                >
                  <option value="">Seleccionar moto</option>
                  {motosDeCliente.map((m) => (
                    <option key={m.id} value={m.id}>{m.marca} {m.modelo}{m.anio ? ` (${m.anio})` : ""}</option>
                  ))}
                </select>
                {!form.cliente_id && <p className="mt-1 text-xs text-zinc-400">Elegí un cliente para listar sus motos.</p>}
              </Field>
            </div>
          ) : (
            <div className="rounded-md bg-zinc-800/50 px-3 py-2 text-xs text-zinc-400">
              Cliente: <span className="text-zinc-200">{clienteMap.get(editing.cliente_id)?.nombre ?? `#${editing.cliente_id}`}</span>
              {" · "}Moto: <span className="text-zinc-200">{(() => { const m = motoMap.get(editing.moto_id); return m ? `${m.marca} ${m.modelo}` : `#${editing.moto_id}` })()}</span>
            </div>
          )}
          <Field label="Descripción *" id="ord-descripcion" error={fieldError ?? undefined}>
            <input
              id="ord-descripcion"
              value={form.descripcion}
              onChange={(e) => {
                setForm((p) => ({ ...p, descripcion: e.target.value }))
                if (fieldError) setFieldError(null)
              }}
              autoFocus={!!editing}
              className={inputClassName(!!fieldError)}
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Total mano de obra" id="ord-mo">
              <input
                id="ord-mo"
                value={form.total_mano_obra}
                inputMode="numeric"
                onChange={(e) => setForm((p) => ({ ...p, total_mano_obra: e.target.value }))}
                className={inputClassName()}
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
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
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
          </div>
        </form>
      </Dialog>

      <Dialog
        open={!!detail}
        title={detail ? `Repuestos · ${detail.descripcion}` : "Detalle"}
        onClose={() => setDetail(null)}
        maxWidth="max-w-2xl"
      >
        {detail && (
          <div className="space-y-3">
            <div className="rounded-md bg-zinc-800/50 px-3 py-2 text-xs text-zinc-400">
              Cliente: <span className="text-zinc-200">{clienteMap.get(detail.cliente_id)?.nombre ?? `#${detail.cliente_id}`}</span>
              {" · "}Mano de obra: <span className="text-zinc-200">{formatMoney(detail.total_mano_obra)}</span>
            </div>

            {repError && (
              <p role="alert" className="rounded-md bg-red-950/50 px-2.5 py-1.5 text-xs text-red-400">{repError}</p>
            )}

            <div>
              <p className="mb-1.5 text-xs font-medium tracking-wide text-zinc-400">Repuestos</p>
              {repuestos.length === 0 ? (
                <p className="py-3 text-center text-xs text-zinc-400">Sin repuestos en esta orden.</p>
              ) : (
                <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
                  {repuestos.map((line) => {
                    const rep = repuestoMap.get(line.repuesto_id)
                    return (
                      <li key={line.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-zinc-100">
                            {rep?.nombre || `#${line.repuesto_id}`}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {line.cantidad} × {formatMoney(line.precio_unitario)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-200">{formatMoney(line.subtotal)}</span>
                          <button
                            onClick={() => onRemoveRepuesto(line)}
                            aria-label={`Quitar ${rep?.nombre || "repuesto"}`}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-red-950/50 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800 pt-2 text-xs">
              <span className="text-zinc-400">Total repuestos</span>
              <span className="text-sm font-semibold text-zinc-100">{formatMoney(totalRepuestos)}</span>
            </div>

            <form onSubmit={onAddRepuesto} noValidate className="grid gap-2 sm:grid-cols-[1fr_90px_auto]">
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
                <button
                  type="submit"
                  disabled={repSaving || !addRepId}
                  className="inline-flex h-[34px] items-center gap-1.5 rounded-md bg-amber-500 px-3 text-xs font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
                >
                  {repSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                  Agregar
                </button>
              </div>
              {addRepId && disponible(addRepId) <= 0 && (
                <p className="text-xs text-red-400 sm:col-span-3">Sin stock disponible para este repuesto.</p>
              )}
            </form>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        title="¿Eliminar orden?"
        description={confirm ? `${confirm.descripcion} será eliminada.` : undefined}
        confirmLabel="Eliminar"
        onClose={() => !deleting && setConfirm(null)}
        onConfirm={onDelete}
      />
    </div>
  )
}

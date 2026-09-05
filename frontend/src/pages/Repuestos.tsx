import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Loader2, PackagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { api, ApiError } from "../api/client"
import type { Repuesto } from "../api/types"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { Dialog } from "../components/Dialog"
import { Field } from "../components/Field"
import { inputClassName, searchInputClassName } from "../components/inputStyles"
import { DataCard, InlineError, PageHeader } from "../components/PageShell"
import { useToast } from "../components/toastContext"
import { buttonClassName } from "../components/buttonStyles"
import { formatMoney } from "../lib/format"

type FormState = {
  codigo: string
  nombre: string
  descripcion: string
  categoria: string
  precio_compra: string
  precio_venta: string
  stock: string
  stock_minimo: string
  ubicacion: string
}

const emptyForm: FormState = {
  codigo: "",
  nombre: "",
  descripcion: "",
  categoria: "",
  precio_compra: "",
  precio_venta: "",
  stock: "0",
  stock_minimo: "5",
  ubicacion: "",
}

export function Repuestos() {
  const toast = useToast()
  const [items, setItems] = useState<Repuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [soloBajo, setSoloBajo] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Repuesto | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<Repuesto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [stockTarget, setStockTarget] = useState<Repuesto | null>(null)
  const [stockDelta, setStockDelta] = useState("")
  const [stockError, setStockError] = useState<string | null>(null)
  const [stockSaving, setStockSaving] = useState(false)

  async function fetchData(params: string) {
    const data = await api<Repuesto[]>(`/api/repuestos${params}`)
    setItems(data ?? [])
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      await fetchData("")
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error cargando repuestos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api<Repuesto[]>("/api/repuestos")
        if (!cancelled) setItems(data ?? [])
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Error cargando repuestos")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    let list = items
    if (term) list = list.filter((r) => [r.nombre, r.codigo].some((v) => v.toLowerCase().includes(term)))
    if (soloBajo) list = list.filter((r) => r.stock <= r.stock_minimo)
    return list
  }, [items, q, soloBajo])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFieldError(null)
    setDialogOpen(true)
  }

  function openEdit(r: Repuesto) {
    setEditing(r)
    setForm({
      codigo: r.codigo,
      nombre: r.nombre,
      descripcion: r.descripcion,
      categoria: r.categoria,
      precio_compra: r.precio_compra ? String(r.precio_compra) : "",
      precio_venta: r.precio_venta ? String(r.precio_venta) : "",
      stock: String(r.stock),
      stock_minimo: String(r.stock_minimo),
      ubicacion: r.ubicacion,
    })
    setFieldError(null)
    setDialogOpen(true)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.codigo.trim()) {
      setFieldError("Código es requerido")
      return
    }
    for (const [key, val] of [
      ["precio_compra", form.precio_compra],
      ["precio_venta", form.precio_venta],
      ["stock", form.stock],
      ["stock_minimo", form.stock_minimo],
    ] as const) {
      if (val && Number.isNaN(Number(val))) {
        setFieldError(`${key} debe ser un número`)
        return
      }
      if (val && Number(val) < 0) {
        setFieldError(`${key} no puede ser negativo`)
        return
      }
    }
    setFieldError(null)
    setSaving(true)
    const isEdit = !!editing
    const body = {
      codigo: form.codigo.trim(),
      nombre: form.nombre,
      descripcion: form.descripcion,
      categoria: form.categoria,
      precio_compra: form.precio_compra ? Number(form.precio_compra) : 0,
      precio_venta: form.precio_venta ? Number(form.precio_venta) : 0,
      stock: form.stock ? Number(form.stock) : 0,
      stock_minimo: form.stock_minimo ? Number(form.stock_minimo) : 0,
      ubicacion: form.ubicacion,
    }
    try {
      if (editing) await api(`/api/repuestos/${editing.id}`, { method: "PUT", body })
      else await api("/api/repuestos", { method: "POST", body })
      setDialogOpen(false)
      setEditing(null)
      toast.success(isEdit ? "Repuesto actualizado" : "Repuesto creado")
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error guardando repuesto")
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!confirm) return
    setDeleting(true)
    try {
      await api(`/api/repuestos/${confirm.id}`, { method: "DELETE" })
      setConfirm(null)
      toast.success("Repuesto eliminado")
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error eliminando repuesto")
    } finally {
      setDeleting(false)
    }
  }

  function openStock(r: Repuesto) {
    setStockTarget(r)
    setStockDelta("")
    setStockError(null)
  }

  async function onAdjustStock(e: React.FormEvent) {
    e.preventDefault()
    if (!stockTarget) return
    const delta = Number(stockDelta)
    if (!delta) {
      setStockError("Ingresá una cantidad")
      return
    }
    setStockError(null)
    setStockSaving(true)
    try {
      const res = await api<{ stock: number }>(`/api/repuestos/${stockTarget.id}/stock`, {
        method: "POST",
        body: { cantidad: delta },
      })
      setStockTarget(null)
      toast.success("Stock ajustado")
      setItems((prev) => prev.map((r) => (r.id === stockTarget.id ? { ...r, stock: res.stock } : r)))
    } catch (e) {
      setStockError(e instanceof ApiError ? e.message : "Error ajustando stock")
    } finally {
      setStockSaving(false)
    }
  }

  const showSearch = !loading && items.length > 0
  const empty = filtered.length === 0
    ? {
        title: (
          <>
            <PackagePlus className="h-4 w-4 text-zinc-500" /> {q || soloBajo ? "Sin resultados" : "Aún no hay repuestos"}
          </>
        ),
        description: q || soloBajo ? "Probá con otro término o desactivá el filtro." : "Agregá tu primer repuesto al inventario.",
        action: !q && !soloBajo ? (
          <button onClick={openCreate} className={buttonClassName("primary")}>
            <Plus className="h-3.5 w-3.5" /> Nuevo repuesto
          </button>
        ) : undefined,
      }
    : null

  return (
    <div className="space-y-3">
      <PageHeader
        title="Repuestos"
        count={!loading && items.length > 0 ? filtered.length : undefined}
        action={
          <button onClick={openCreate} className={buttonClassName("primary")}>
            <Plus className="h-3.5 w-3.5" /> Nuevo
          </button>
        }
      />

      {error && items.length > 0 && <InlineError message={error} />}

      {showSearch && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o código"
              inputMode="search"
              className={searchInputClassName()}
            />
          </div>
          <button
            onClick={() => setSoloBajo((v) => !v)}
            aria-pressed={soloBajo}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              soloBajo ? "border-amber-500/50 bg-amber-500/15 text-amber-500" : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Stock bajo
          </button>
        </div>
      )}

      <DataCard
        loading={loading}
        loadingText="Cargando repuestos..."
        error={error}
        errorTitle="No se pudieron cargar los repuestos"
        onRetry={load}
        empty={empty}
      >
        <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Listado</caption>
                <thead className="border-b border-zinc-800 text-zinc-400">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Repuesto</th>
                    <th scope="col" className="px-3 py-2 font-medium">Categoría</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">P. venta</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Stock</th>
                    <th scope="col" className="w-28 px-3 py-2 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filtered.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-zinc-800/40">
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-zinc-100">{r.nombre || r.codigo}</div>
                        <div className="truncate text-xs text-zinc-500">{r.codigo}{r.ubicacion ? ` · ${r.ubicacion}` : ""}</div>
                      </td>
                      <td className="px-3 py-2.5 text-zinc-400">{r.categoria || "—"}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-300">{formatMoney(r.precio_venta)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={r.stock <= r.stock_minimo ? "font-semibold text-red-400" : "text-zinc-300"}>
                          {r.stock}
                        </span>
                        <span className="text-zinc-500"> / {r.stock_minimo}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openStock(r)}
                            aria-label={`Ajustar stock de ${r.nombre || r.codigo}`}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-sky-400 hover:bg-sky-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          >
                            <PackagePlus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(r)}
                            aria-label={`Editar ${r.nombre || r.codigo}`}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirm(r)}
                            aria-label={`Eliminar ${r.nombre || r.codigo}`}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-red-950/50 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-zinc-800 sm:hidden">
              {filtered.map((r) => (
                <li key={r.id} className="px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-zinc-100">{r.nombre || r.codigo}</div>
                      <div className="truncate text-xs text-zinc-500">
                        {r.codigo}{r.categoria ? ` · ${r.categoria}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-zinc-200">{formatMoney(r.precio_venta)}</div>
                      <div className={r.stock <= r.stock_minimo ? "text-xs font-semibold text-red-400" : "text-xs text-zinc-500"}>
                        {r.stock} / {r.stock_minimo}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end gap-1.5">
                    <button
                      onClick={() => openStock(r)}
                      aria-label={`Ajustar stock de ${r.nombre || r.codigo}`}
                      className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-sky-400 hover:bg-sky-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <PackagePlus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(r)}
                      aria-label={`Editar ${r.nombre || r.codigo}`}
                      className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirm(r)}
                      aria-label={`Eliminar ${r.nombre || r.codigo}`}
                      className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-zinc-400 hover:bg-red-950/50 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
      </DataCard>

      <Dialog open={dialogOpen} title={editing ? "Editar repuesto" : "Nuevo repuesto"} onClose={() => (saving ? undefined : setDialogOpen(false))}>
        <form onSubmit={onSubmit} noValidate className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Código *" id="rep-codigo" error={fieldError ?? undefined}>
              <input
                id="rep-codigo"
                value={form.codigo}
                onChange={(e) => {
                  setForm((p) => ({ ...p, codigo: e.target.value }))
                  if (fieldError) setFieldError(null)
                }}
                autoFocus
                className={inputClassName(!!fieldError)}
                placeholder="FIL-001"
              />
            </Field>
            <Field label="Nombre" id="rep-nombre">
              <input
                id="rep-nombre"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                className={inputClassName()}
                placeholder="Filtro de aceite"
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Categoría" id="rep-categoria">
              <input
                id="rep-categoria"
                value={form.categoria}
                onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                className={inputClassName()}
                placeholder="Mantenimiento"
              />
            </Field>
            <Field label="Ubicación" id="rep-ubicacion">
              <input
                id="rep-ubicacion"
                value={form.ubicacion}
                onChange={(e) => setForm((p) => ({ ...p, ubicacion: e.target.value }))}
                className={inputClassName()}
                placeholder="Estante A1"
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Precio compra" id="rep-compra">
              <input
                id="rep-compra"
                value={form.precio_compra}
                inputMode="numeric"
                onChange={(e) => setForm((p) => ({ ...p, precio_compra: e.target.value }))}
                className={inputClassName()}
              />
            </Field>
            <Field label="Precio venta" id="rep-venta">
              <input
                id="rep-venta"
                value={form.precio_venta}
                inputMode="numeric"
                onChange={(e) => setForm((p) => ({ ...p, precio_venta: e.target.value }))}
                className={inputClassName()}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Stock inicial" id="rep-stock">
              <input
                id="rep-stock"
                value={form.stock}
                inputMode="numeric"
                onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                className={inputClassName()}
              />
            </Field>
            <Field label="Stock mínimo" id="rep-minimo">
              <input
                id="rep-minimo"
                value={form.stock_minimo}
                inputMode="numeric"
                onChange={(e) => setForm((p) => ({ ...p, stock_minimo: e.target.value }))}
                className={inputClassName()}
              />
            </Field>
          </div>
          <Field label="Descripción" id="rep-descripcion">
            <textarea
              id="rep-descripcion"
              value={form.descripcion}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              rows={2}
              className={inputClassName()}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setDialogOpen(false)} disabled={saving} className={buttonClassName("secondary")}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} aria-busy={saving} className={buttonClassName("primary")}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              {editing ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={!!stockTarget}
        title={stockTarget ? `Ajustar stock: ${stockTarget.nombre || stockTarget.codigo}` : "Ajustar stock"}
        onClose={() => setStockTarget(null)}
      >
        <form onSubmit={onAdjustStock} noValidate className="space-y-3">
          <p className="text-xs text-zinc-400">
            Stock actual: <span className="font-semibold text-zinc-200">{stockTarget?.stock ?? 0}</span>
            {" · "}Mínimo: <span className="text-zinc-200">{stockTarget?.stock_minimo ?? 0}</span>
          </p>
          {stockError && (
            <p role="alert" className="rounded-md bg-red-950/50 px-2.5 py-1.5 text-xs text-red-400">
              {stockError}
            </p>
          )}
          <Field label="Cantidad (positivo suma, negativo resta)" id="rep-delta">
            <input
              id="rep-delta"
              value={stockDelta}
              inputMode="numeric"
              autoFocus
              onChange={(e) => {
                setStockDelta(e.target.value)
                if (stockError) setStockError(null)
              }}
              className={inputClassName(!!stockError)}
              placeholder="0"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setStockTarget(null)} disabled={stockSaving} className={buttonClassName("secondary")}>
              Cancelar
            </button>
            <button type="submit" disabled={stockSaving} aria-busy={stockSaving} className={buttonClassName("primary")}>
              {stockSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              Ajustar
            </button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        title="¿Eliminar repuesto?"
        description={confirm ? `${confirm.nombre || confirm.codigo} será eliminado.` : undefined}
        busy={deleting}
        onClose={() => !deleting && setConfirm(null)}
        onConfirm={onDelete}
      />
    </div>
  )
}

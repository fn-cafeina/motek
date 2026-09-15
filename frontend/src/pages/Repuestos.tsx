import { useMemo, useState } from "react"
import { AlertTriangle, Loader2, PackagePlus, Plus } from "lucide-react"
import { api } from "../api/client"
import type { Repuesto } from "../api/types"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { Dialog } from "../components/Dialog"
import { Form, FormActions, FormGrid } from "../components/ui/Form"
import { Field } from "../components/Field"
import { inputClassName } from "../components/inputStyles"
import { Alert } from "../components/ui/Alert"
import { DataCard, InlineError, PageHeader } from "../components/PageShell"
import { PageStack } from "../components/layout/PageStack"
import { FilterBar } from "../components/ui/FilterBar"
import { SearchInput } from "../components/ui/SearchInput"
import { RowActions } from "../components/ui/RowActions"
import { MobileList, Table, Tbody, Th, Thead, Td, Tr } from "../components/ui/Table"
import { useToast } from "../components/toastContext"
import { buttonClassName } from "../components/buttonStyles"
import { useCollection } from "../hooks/useCollection"
import { getErrorMessage } from "../lib/errors"
import { numberField, required } from "../lib/validate"
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
  const { items, setItems, loading, error, setError, load, refresh } = useCollection<Repuesto>("/api/repuestos", "Error cargando repuestos")
  const [q, setQ] = useState("")
  const [soloBajo, setSoloBajo] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Repuesto | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<Repuesto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [stockTarget, setStockTarget] = useState<Repuesto | null>(null)
  const [stockDelta, setStockDelta] = useState("")
  const [stockError, setStockError] = useState<string | null>(null)
  const [stockSaving, setStockSaving] = useState(false)

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
    setFieldErrors({})
    setSubmitError(null)
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
    setFieldErrors({})
    setSubmitError(null)
    setDialogOpen(true)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    const codigoError = required(form.codigo, "Código es requerido")
    if (codigoError) next.codigo = codigoError
    const labels: Record<string, string> = {
      precio_compra: "Precio compra",
      precio_venta: "Precio venta",
      stock: "Stock",
      stock_minimo: "Stock mínimo",
    }
    for (const [key, val] of [
      ["precio_compra", form.precio_compra],
      ["precio_venta", form.precio_venta],
      ["stock", form.stock],
      ["stock_minimo", form.stock_minimo],
    ] as const) {
      const err = numberField(val, { label: labels[key] })
      if (err) next[key] = err
    }
    setFieldErrors(next)
    if (Object.keys(next).length > 0) return
    setSubmitError(null)
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
      await refresh()
    } catch (e) {
      setSubmitError(getErrorMessage(e, "Error guardando repuesto"))
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
      await refresh()
    } catch (e) {
      setError(getErrorMessage(e, "Error eliminando repuesto"))
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
      setStockError(getErrorMessage(e, "Error ajustando stock"))
    } finally {
      setStockSaving(false)
    }
  }

  const hasFilter = q.trim() !== "" || soloBajo
  function clearFilters() {
    setQ("")
    setSoloBajo(false)
  }
  const countLabel = loading
    ? undefined
    : hasFilter
      ? `${filtered.length} de ${items.length}`
      : `${items.length} ${items.length === 1 ? "repuesto" : "repuestos"}`
  const empty = filtered.length === 0
    ? hasFilter
      ? {
          title: "Sin resultados",
          description: "Probá con otro término o limpiá los filtros.",
          action: (
            <button onClick={clearFilters} className={buttonClassName("secondary")}>
              Limpiar filtros
            </button>
          ),
        }
      : {
          title: "Aún no hay repuestos",
          description: "Cargá el repuesto con código y stock para descontarlo en las órdenes.",
        }
    : null

  return (
    <>
      <PageStack>
        <PageHeader title="Repuestos" />

        {error && items.length > 0 && <InlineError message={error} />}

        <DataCard
          loading={loading}
          loadingText="Cargando repuestos"
          error={error}
          errorTitle="No se pudieron cargar los repuestos"
          onRetry={load}
          empty={empty}
          toolbar={
            <FilterBar>
              <SearchInput value={q} onChange={setQ} placeholder="Buscar por nombre o código" />
              <button
                onClick={() => setSoloBajo((v) => !v)}
                aria-pressed={soloBajo}
                className={buttonClassName(soloBajo ? "primary" : "secondary")}
              >
                <AlertTriangle className="h-4 w-4" aria-hidden /> Stock bajo
              </button>
              <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-end">
                {countLabel && <span className="whitespace-nowrap text-[12px] text-muted">{countLabel}</span>}
                <button onClick={openCreate} className={buttonClassName("primary")}>
                  <Plus className="h-4 w-4" aria-hidden /> Nuevo repuesto
                </button>
              </div>
            </FilterBar>
          }
        >
          <>
            <Table caption="Inventario de repuestos">
              <Thead>
                <tr>
                  <Th>Repuesto</Th>
                  <Th>Categoría</Th>
                  <Th align="right">P. venta</Th>
                  <Th align="right">Stock</Th>
                  <Th className="w-28" align="right">
                    <span className="sr-only">Acciones</span>
                  </Th>
                </tr>
              </Thead>
              <Tbody>
                {filtered.map((r) => (
                  <Tr key={r.id}>
                    <Td>
                      <div className="font-medium text-fg">{r.nombre || r.codigo}</div>
                      <div className="truncate text-[12px] text-subtle">{r.codigo}{r.ubicacion ? ` · ${r.ubicacion}` : ""}</div>
                    </Td>
                    <Td className="text-muted">{r.categoria || "—"}</Td>
                    <Td align="right" className="text-muted">{formatMoney(r.precio_venta)}</Td>
                    <Td align="right" className="whitespace-nowrap">
                      <span className={r.stock <= r.stock_minimo ? "font-semibold text-accent" : "text-fg"}>
                        {r.stock}
                      </span>
                      <span className="text-subtle"> de {r.stock_minimo} mín.</span>
                    </Td>
                    <Td>
                      <RowActions
                        actions={[{ onClick: () => openStock(r), label: `Ajustar stock de ${r.nombre || r.codigo}`, icon: <PackagePlus className="h-3.5 w-3.5" />, tone: "info" }]}
                        onEdit={() => openEdit(r)}
                        editLabel={`Editar ${r.nombre || r.codigo}`}
                        onDelete={() => setConfirm(r)}
                        deleteLabel={`Eliminar ${r.nombre || r.codigo}`}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <MobileList>
              {filtered.map((r) => (
                <li key={r.id} className="min-w-0 px-4 py-3">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-fg">{r.nombre || r.codigo}</div>
                      <div className="truncate text-[12px] text-subtle">
                        {r.codigo}{r.categoria ? ` · ${r.categoria}` : ""}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[13px] font-semibold tabular-nums text-fg">{formatMoney(r.precio_venta)}</div>
                      <div className={r.stock <= r.stock_minimo ? "text-[12px] font-semibold tabular-nums text-accent" : "text-[12px] tabular-nums text-muted"}>
                        {r.stock} de {r.stock_minimo} mín.
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end gap-1.5">
                    <RowActions
                      variant="card"
                      actions={[{ onClick: () => openStock(r), label: `Ajustar stock de ${r.nombre || r.codigo}`, icon: <PackagePlus className="h-3.5 w-3.5" />, tone: "info" }]}
                      onEdit={() => openEdit(r)}
                      editLabel={`Editar ${r.nombre || r.codigo}`}
                      onDelete={() => setConfirm(r)}
                      deleteLabel={`Eliminar ${r.nombre || r.codigo}`}
                    />
                  </div>
                </li>
              ))}
            </MobileList>
          </>
        </DataCard>
      </PageStack>

      <Dialog open={dialogOpen} title={editing ? "Editar repuesto" : "Nuevo repuesto"} dismissible={!saving} onClose={() => setDialogOpen(false)}>
        <Form onSubmit={onSubmit}>
          {submitError && (
            <Alert tone="danger" live>
              {submitError}
            </Alert>
          )}
          <FormGrid>
            <Field label="Código *" id="rep-codigo" error={fieldErrors.codigo}>
              <input
                id="rep-codigo"
                value={form.codigo}
                onChange={(e) => {
                  setForm((p) => ({ ...p, codigo: e.target.value }))
                  if (fieldErrors.codigo) setFieldErrors((p) => ({ ...p, codigo: undefined }))
                }}
                aria-invalid={!!fieldErrors.codigo}
                aria-describedby={fieldErrors.codigo ? "rep-codigo-error" : undefined}
                className={inputClassName(!!fieldErrors.codigo)}
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
          </FormGrid>
          <FormGrid>
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
          </FormGrid>
          <FormGrid>
            <Field label="Precio compra" id="rep-compra" error={fieldErrors.precio_compra}>
              <input
                id="rep-compra"
                value={form.precio_compra}
                inputMode="numeric"
                onChange={(e) => {
                  setForm((p) => ({ ...p, precio_compra: e.target.value }))
                  if (fieldErrors.precio_compra) setFieldErrors((p) => ({ ...p, precio_compra: undefined }))
                }}
                aria-invalid={!!fieldErrors.precio_compra}
                className={inputClassName(!!fieldErrors.precio_compra)}
              />
            </Field>
            <Field label="Precio venta" id="rep-venta" error={fieldErrors.precio_venta}>
              <input
                id="rep-venta"
                value={form.precio_venta}
                inputMode="numeric"
                onChange={(e) => {
                  setForm((p) => ({ ...p, precio_venta: e.target.value }))
                  if (fieldErrors.precio_venta) setFieldErrors((p) => ({ ...p, precio_venta: undefined }))
                }}
                aria-invalid={!!fieldErrors.precio_venta}
                className={inputClassName(!!fieldErrors.precio_venta)}
              />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="Stock inicial" id="rep-stock" error={fieldErrors.stock}>
              <input
                id="rep-stock"
                value={form.stock}
                inputMode="numeric"
                onChange={(e) => {
                  setForm((p) => ({ ...p, stock: e.target.value }))
                  if (fieldErrors.stock) setFieldErrors((p) => ({ ...p, stock: undefined }))
                }}
                aria-invalid={!!fieldErrors.stock}
                className={inputClassName(!!fieldErrors.stock)}
              />
            </Field>
            <Field label="Stock mínimo" id="rep-minimo" error={fieldErrors.stock_minimo}>
              <input
                id="rep-minimo"
                value={form.stock_minimo}
                inputMode="numeric"
                onChange={(e) => {
                  setForm((p) => ({ ...p, stock_minimo: e.target.value }))
                  if (fieldErrors.stock_minimo) setFieldErrors((p) => ({ ...p, stock_minimo: undefined }))
                }}
                aria-invalid={!!fieldErrors.stock_minimo}
                className={inputClassName(!!fieldErrors.stock_minimo)}
              />
            </Field>
          </FormGrid>
          <Field label="Descripción" id="rep-descripcion">
            <textarea
              id="rep-descripcion"
              value={form.descripcion}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              rows={2}
              className={inputClassName()}
            />
          </Field>
          <FormActions>
            <button type="button" onClick={() => setDialogOpen(false)} disabled={saving} className={buttonClassName("secondary")}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} aria-busy={saving} className={buttonClassName("primary")}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              {editing ? "Guardar" : "Crear"}
            </button>
          </FormActions>
        </Form>
      </Dialog>

      <Dialog
        open={!!stockTarget}
        title={stockTarget ? `Ajustar stock: ${stockTarget.nombre || stockTarget.codigo}` : "Ajustar stock"}
        onClose={() => setStockTarget(null)}
      >
        <Form onSubmit={onAdjustStock}>
          <p className="text-[13px] text-muted">
            Stock actual: <span className="font-semibold tabular-nums text-fg">{stockTarget?.stock ?? 0}</span>
            {" · "}Mínimo: <span className="tabular-nums text-fg">{stockTarget?.stock_minimo ?? 0}</span>
          </p>
          {stockError && (
            <Alert tone="danger" live>
              {stockError}
            </Alert>
          )}
          <Field label="Cantidad (positivo suma, negativo resta)" id="rep-delta">
            <input
              id="rep-delta"
              value={stockDelta}
              inputMode="numeric"
              onChange={(e) => {
                setStockDelta(e.target.value)
                if (stockError) setStockError(null)
              }}
              className={inputClassName(!!stockError)}
              placeholder="0"
            />
          </Field>
          <FormActions>
            <button type="button" onClick={() => setStockTarget(null)} disabled={stockSaving} className={buttonClassName("secondary")}>
              Cancelar
            </button>
            <button type="submit" disabled={stockSaving} aria-busy={stockSaving} className={buttonClassName("primary")}>
              {stockSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              Ajustar
            </button>
          </FormActions>
        </Form>
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        title="¿Eliminar repuesto?"
        description={confirm ? `${confirm.nombre || confirm.codigo} será eliminado.` : undefined}
        busy={deleting}
        onClose={() => !deleting && setConfirm(null)}
        onConfirm={onDelete}
      />
    </>
  )
}

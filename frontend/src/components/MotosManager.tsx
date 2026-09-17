import { useCallback, useEffect, useState } from "react"
import { Bike, Plus } from "lucide-react"
import { api } from "../api/client"
import type { Cliente, Moto } from "../api/types"
import { ConfirmDialog } from "./ConfirmDialog"
import { Dialog } from "./Dialog"
import { Form, FormActions, FormGrid } from "./ui/Form"
import { Field } from "./Field"
import { inputClassName } from "./inputStyles"
import { Alert } from "./ui/Alert"
import { EmptyState } from "./ui/EmptyState"
import { RowActions } from "./ui/RowActions"
import { Spinner } from "./ui/Spinner"
import { useToast } from "./toastContext"
import { buttonClassName } from "./buttonStyles"
import { useResumen } from "../contexts/resumenContext"
import { getErrorMessage } from "../lib/errors"
import { numberField, required } from "../lib/validate"

type MotoForm = {
  marca: string
  modelo: string
  anio: string
  placa: string
  color: string
  vin: string
  kilometraje: string
}

const emptyForm: MotoForm = {
  marca: "",
  modelo: "",
  anio: "",
  placa: "",
  color: "",
  vin: "",
  kilometraje: "",
}

export function MotosManager({ cliente }: { cliente: Cliente }) {
  const toast = useToast()
  const { ordenes, facturas } = useResumen()
  const [listOpen, setListOpen] = useState(false)
  const [motos, setMotos] = useState<Moto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Moto | null>(null)
  const [form, setForm] = useState<MotoForm>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<{ marca?: string; anio?: string; kilometraje?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<Moto | null>(null)
  const [alcance, setAlcance] = useState<{ ordenes: number; facturas: number } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadMotos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api<Moto[]>(`/api/clientes/${cliente.id}/motos`)
      setMotos(data ?? [])
    } catch (e) {
      setError(getErrorMessage(e, "Error cargando motos"))
    } finally {
      setLoading(false)
    }
  }, [cliente.id])

  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect
    if (listOpen) void loadMotos()
  }, [listOpen, loadMotos])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFieldErrors({})
    setFormError(null)
    setDialogOpen(true)
  }

  function openEdit(m: Moto) {
    setEditing(m)
    setForm({
      marca: m.marca,
      modelo: m.modelo,
      anio: m.anio ? String(m.anio) : "",
      placa: m.placa,
      color: m.color,
      vin: m.vin,
      kilometraje: m.kilometraje ? String(m.kilometraje) : "",
    })
    setFieldErrors({})
    setFormError(null)
    setDialogOpen(true)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof fieldErrors = {}
    const marcaError = required(form.marca, "Marca es requerida")
    if (marcaError) next.marca = marcaError
    const anioError = numberField(form.anio, { label: "Año" })
    if (anioError) next.anio = anioError
    const kmError = numberField(form.kilometraje, { label: "Kilometraje" })
    if (kmError) next.kilometraje = kmError
    setFieldErrors(next)
    if (next.marca || next.anio || next.kilometraje) return
    setFormError(null)
    setSaving(true)
    const isEdit = !!editing
    const body = {
      marca: form.marca.trim(),
      modelo: form.modelo,
      anio: form.anio ? Number(form.anio) : 0,
      placa: form.placa,
      color: form.color,
      vin: form.vin,
      kilometraje: form.kilometraje ? Number(form.kilometraje) : 0,
    }
    try {
      if (editing) await api(`/api/motos/${editing.id}`, { method: "PUT", body })
      else await api(`/api/clientes/${cliente.id}/motos`, { method: "POST", body })
      setDialogOpen(false)
      setEditing(null)
      toast.success(isEdit ? "Moto actualizada" : "Moto creada")
      await loadMotos()
    } catch (e) {
      setFormError(getErrorMessage(e, "Error guardando moto"))
    } finally {
      setSaving(false)
    }
  }

  // Las órdenes caen por cascada con la moto; una factura emitida lo impide del todo.
  function pedirConfirmacion(m: Moto) {
    setConfirm(m)
    const propias = ordenes.filter((o) => o.moto_id === m.id)
    const ids = new Set(propias.map((o) => o.id))
    setAlcance({
      ordenes: propias.length,
      facturas: facturas.filter((f) => ids.has(f.orden_id)).length,
    })
  }

  async function onDelete() {
    if (!confirm) return
    setDeleting(true)
    try {
      await api(`/api/motos/${confirm.id}`, { method: "DELETE" })
      setConfirm(null)
      toast.success("Moto eliminada")
      await loadMotos()
    } catch (e) {
      toast.error(getErrorMessage(e, "Error eliminando moto"))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setListOpen(true)}
        aria-label={`Motos de ${cliente.nombre}${motos.length ? ` (${motos.length})` : ""}`}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-fg"
      >
        <Bike className="size-3.5" aria-hidden />
        {motos.length > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-md border border-border bg-raised px-1 text-center text-[11px] font-semibold leading-4 tabular-nums text-muted ring-2 ring-surface">
            {motos.length}
          </span>
        )}
      </button>

      <Dialog
        open={listOpen}
        title={`Motos de ${cliente.nombre}${motos.length > 0 ? ` · ${motos.length}` : ""}`}
        onClose={() => setListOpen(false)}
        footer={
          <div className="flex justify-end">
            <button onClick={openCreate} className={buttonClassName("primary")}>
              <Plus className="size-4" aria-hidden /> Nueva moto
            </button>
          </div>
        }
      >
        {error && (
          <div className="mb-3">
            <Alert tone="danger" live>
              {error}
            </Alert>
          </div>
        )}
        {loading ? (
          <div role="status" className="flex items-center justify-center gap-2 py-8 text-[13px] text-muted">
            <Spinner /> Cargando motos
          </div>
        ) : motos.length === 0 ? (
          <EmptyState
            title="Sin motos registradas"
            description="Agregá la primera moto de este cliente para poder abrir órdenes de trabajo."
          />
        ) : (
          <ul className="divide-y divide-border">
            {motos.map((m) => {
              const detalle = [m.color, m.kilometraje ? `${m.kilometraje} km` : ""].filter(Boolean).join(" · ")
              return (
                <li key={m.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-fg">
                      {m.marca} {m.modelo}
                      {m.anio ? ` (${m.anio})` : ""}
                    </div>
                    <div className="truncate text-[12px] text-subtle">
                      {m.placa && <span className="motek-code">{m.placa}</span>}
                      {m.placa && detalle ? " · " : ""}
                      {detalle || (m.placa ? "" : "—")}
                    </div>
                  </div>
                  <RowActions
                    onEdit={() => openEdit(m)}
                    editLabel={`Editar ${m.marca} ${m.modelo}`}
                    onDelete={() => pedirConfirmacion(m)}
                    deleteLabel={`Eliminar ${m.marca} ${m.modelo}`}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </Dialog>

      <Dialog open={dialogOpen} title={editing ? "Editar moto" : "Nueva moto"} dismissible={!saving} onClose={() => setDialogOpen(false)}>
        <Form onSubmit={onSubmit}>
          {formError && (
            <Alert tone="danger" live>
              {formError}
            </Alert>
          )}
          <FormGrid>
            <Field label="Marca *" id="moto-marca" error={fieldErrors.marca}>
              <input
                id="moto-marca"
                value={form.marca}
                onChange={(e) => {
                  setForm((p) => ({ ...p, marca: e.target.value }))
                  if (fieldErrors.marca) setFieldErrors((p) => ({ ...p, marca: undefined }))
                }}
                aria-invalid={!!fieldErrors.marca}
                aria-describedby={fieldErrors.marca ? "moto-marca-error" : undefined}
                className={inputClassName(!!fieldErrors.marca)}
                placeholder="Honda"
              />
            </Field>
            <Field label="Modelo" id="moto-modelo">
              <input
                id="moto-modelo"
                value={form.modelo}
                onChange={(e) => setForm((p) => ({ ...p, modelo: e.target.value }))}
                className={inputClassName()}
                placeholder="CB190R"
              />
            </Field>
          </FormGrid>
          <FormGrid cols={3}>
            <Field label="Año" id="moto-anio" error={fieldErrors.anio}>
              <input
                id="moto-anio"
                value={form.anio}
                inputMode="numeric"
                onChange={(e) => {
                  setForm((p) => ({ ...p, anio: e.target.value }))
                  if (fieldErrors.anio) setFieldErrors((p) => ({ ...p, anio: undefined }))
                }}
                aria-invalid={!!fieldErrors.anio}
                className={inputClassName(!!fieldErrors.anio)}
                placeholder="2022"
              />
            </Field>
            <Field label="Placa" id="moto-placa">
              <input
                id="moto-placa"
                value={form.placa}
                onChange={(e) => setForm((p) => ({ ...p, placa: e.target.value }))}
                className={inputClassName()}
                placeholder="AB 123 CD"
              />
            </Field>
            <Field label="Color" id="moto-color">
              <input
                id="moto-color"
                value={form.color}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                className={inputClassName()}
                placeholder="Negro"
              />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="VIN" id="moto-vin">
              <input
                id="moto-vin"
                value={form.vin}
                onChange={(e) => setForm((p) => ({ ...p, vin: e.target.value }))}
                className={inputClassName()}
              />
            </Field>
            <Field label="Kilometraje" id="moto-km" error={fieldErrors.kilometraje}>
              <input
                id="moto-km"
                value={form.kilometraje}
                inputMode="numeric"
                onChange={(e) => {
                  setForm((p) => ({ ...p, kilometraje: e.target.value }))
                  if (fieldErrors.kilometraje) setFieldErrors((p) => ({ ...p, kilometraje: undefined }))
                }}
                aria-invalid={!!fieldErrors.kilometraje}
                className={inputClassName(!!fieldErrors.kilometraje)}
                placeholder="15000"
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
              {saving && <Spinner />}
              {editing ? "Guardar" : "Crear"}
            </button>
          </FormActions>
        </Form>
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        busy={deleting}
        title="¿Eliminar moto?"
        description={
          confirm && (
            <>
              <p>
                {confirm.marca} {confirm.modelo} se va a eliminar.
              </p>
              {alcance && alcance.ordenes > 0 && !(alcance.facturas > 0) && (
                <p>
                  {alcance.ordenes === 1 ? "También se borra" : "También se borran"}{" "}
                  <span className="font-medium text-fg">
                    {alcance.ordenes} {alcance.ordenes === 1 ? "orden de trabajo" : "órdenes de trabajo"}
                  </span>
                  .
                </p>
              )}
            </>
          )
        }
        blocked={
          alcance && alcance.facturas > 0
            ? {
                title: "Tiene facturas emitidas",
                description: "No se puede eliminar mientras existan facturas de sus órdenes.",
              }
            : undefined
        }
        onClose={() => !deleting && setConfirm(null)}
        onConfirm={onDelete}
      />
    </>
  )
}

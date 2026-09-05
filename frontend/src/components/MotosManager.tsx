import { useEffect, useState } from "react"
import { Bike, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { api, ApiError } from "../api/client"
import type { Cliente, Moto } from "../api/types"
import { ConfirmDialog } from "./ConfirmDialog"
import { Dialog } from "./Dialog"
import { Form, FormActions, FormGrid } from "./ui/Form"
import { Field } from "./Field"
import { inputClassName } from "./inputStyles"
import { Empty } from "./Empty"
import { useToast } from "./toastContext"
import { buttonClassName } from "./buttonStyles"

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
  const [listOpen, setListOpen] = useState(false)
  const [motos, setMotos] = useState<Moto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Moto | null>(null)
  const [form, setForm] = useState<MotoForm>(emptyForm)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<Moto | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function loadMotos() {
    setLoading(true)
    setError(null)
    try {
      const data = await api<Moto[]>(`/api/clientes/${cliente.id}/motos`)
      setMotos(data ?? [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error cargando motos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (listOpen) loadMotos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listOpen])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFieldError(null)
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
    setFieldError(null)
    setDialogOpen(true)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.marca.trim()) {
      setFieldError("Marca es requerida")
      return
    }
    setFieldError(null)
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
      setError(e instanceof ApiError ? e.message : "Error guardando moto")
    } finally {
      setSaving(false)
    }
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
      setError(e instanceof ApiError ? e.message : "Error eliminando moto")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setListOpen(true)}
        className={buttonClassName("secondary")}
      >
        <Bike className="h-3.5 w-3.5" /> Motos
      </button>

      <Dialog open={listOpen} title={`Motos de ${cliente.nombre}`} onClose={() => setListOpen(false)}>
        {error && (
          <p role="alert" className="mb-2.5 rounded-md bg-red-950/50 px-2.5 py-1.5 text-xs text-red-400">
            {error}
          </p>
        )}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando motos...
          </div>
        ) : motos.length === 0 ? (
          <Empty
            title="Sin motos registradas"
            description="Agregá la primera moto de este cliente."
            action={
              <button
                onClick={openCreate}
                className={buttonClassName("primary")}
              >
                <Plus className="h-3.5 w-3.5" /> Nueva moto
              </button>
            }
          />
        ) : (
          <>
            <ul className="max-h-72 divide-y divide-zinc-800 overflow-y-auto">
              {motos.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-100">
                      {m.marca} {m.modelo}
                      {m.anio ? ` (${m.anio})` : ""}
                    </div>
                    <div className="truncate text-xs text-zinc-500">
                      {[m.placa, m.color, m.kilometraje ? `${m.kilometraje} km` : ""].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => openEdit(m)}
                      aria-label={`Editar ${m.marca} ${m.modelo}`}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirm(m)}
                      aria-label={`Eliminar ${m.marca} ${m.modelo}`}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-red-950/50 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-end">
              <button
                onClick={openCreate}
                className={buttonClassName("primary")}
              >
                <Plus className="h-3.5 w-3.5" /> Nueva moto
              </button>
            </div>
          </>
        )}
      </Dialog>

      <Dialog open={dialogOpen} title={editing ? "Editar moto" : "Nueva moto"} dismissible={!saving} onClose={() => setDialogOpen(false)}>
        <Form onSubmit={onSubmit}>
          <FormGrid>
            <Field label="Marca *" id="moto-marca" error={fieldError ?? undefined}>
              <input
                id="moto-marca"
                value={form.marca}
                onChange={(e) => {
                  setForm((p) => ({ ...p, marca: e.target.value }))
                  if (fieldError) setFieldError(null)
                }}
                autoFocus
                className={inputClassName(!!fieldError)}
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
            <Field label="Año" id="moto-anio">
              <input
                id="moto-anio"
                value={form.anio}
                inputMode="numeric"
                onChange={(e) => setForm((p) => ({ ...p, anio: e.target.value }))}
                className={inputClassName()}
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
            <Field label="Kilometraje" id="moto-km">
              <input
                id="moto-km"
                value={form.kilometraje}
                inputMode="numeric"
                onChange={(e) => setForm((p) => ({ ...p, kilometraje: e.target.value }))}
                className={inputClassName()}
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
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              {editing ? "Guardar" : "Crear"}
            </button>
          </FormActions>
        </Form>
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        busy={deleting}
        title="¿Eliminar moto?"
        description={confirm ? `${confirm.marca} ${confirm.modelo} será eliminada.` : undefined}
        onClose={() => !deleting && setConfirm(null)}
        onConfirm={onDelete}
      />
    </>
  )
}

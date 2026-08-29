import { useEffect, useMemo, useState } from "react"
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { api, ApiError } from "../api/client"
import type { Cliente } from "../api/types"
import { Card } from "../components/Card"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { Field, inputClassName } from "../components/Field"

type FormState = { nombre: string; telefono: string; email: string; direccion: string; notas: string }
const emptyForm: FormState = { nombre: "", telefono: "", email: "", direccion: "", notas: "" }

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-3 py-3">
        <div className="h-3 w-28 rounded bg-zinc-800" />
      </td>
      <td className="px-3 py-3">
        <div className="h-3 w-20 rounded bg-zinc-800" />
      </td>
      <td className="px-3 py-3">
        <div className="h-3 w-32 rounded bg-zinc-800" />
      </td>
      <td className="px-3 py-3">
        <div className="ml-auto h-6 w-20 rounded bg-zinc-800" />
      </td>
    </tr>
  )
}

function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            Cerrar
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<Cliente | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await api<Cliente[]>("/api/clientes")
      setClientes(data ?? [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error cargando clientes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return clientes
    return clientes.filter((c) => [c.nombre, c.telefono, c.email].some((v) => v.toLowerCase().includes(term)))
  }, [clientes, q])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFieldError(null)
    setDialogOpen(true)
  }

  function openEdit(c: Cliente) {
    setEditing(c)
    setForm({ nombre: c.nombre, telefono: c.telefono, email: c.email, direccion: c.direccion, notas: c.notas })
    setFieldError(null)
    setDialogOpen(true)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setFieldError("Nombre es requerido")
      return
    }
    setFieldError(null)
    setSaving(true)
    try {
      if (editing) await api(`/api/clientes/${editing.id}`, { method: "PUT", body: form })
      else await api("/api/clientes", { method: "POST", body: form })
      setDialogOpen(false)
      setEditing(null)
      setForm(emptyForm)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error guardando cliente")
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!confirm) return
    setDeleting(true)
    try {
      await api(`/api/clientes/${confirm.id}`, { method: "DELETE" })
      setConfirm(null)
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error eliminando cliente")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-sm font-semibold text-zinc-100">Clientes</h1>
          <p className="text-xs text-zinc-500">
            {loading ? "Cargando..." : `${filtered.length} ${filtered.length === 1 ? "cliente" : "clientes"}`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          <Plus className="h-3.5 w-3.5" /> Nuevo cliente
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-950/50 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, teléfono o email"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 py-1.5 pl-8 pr-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          />
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-900 text-zinc-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">Teléfono</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-zinc-300">{q ? "Sin resultados" : "Sin clientes"}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {q ? "Probá con otro término de búsqueda." : "Creá tu primer cliente para empezar."}
            </p>
            {!q && (
              <button
                onClick={openCreate}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-400"
              >
                <Plus className="h-3.5 w-3.5" /> Crear cliente
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="sticky top-0 z-[1] border-b border-zinc-800 bg-zinc-900 text-zinc-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">Teléfono</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                {filtered.map((c) => (
                  <tr key={c.id} className="group hover:bg-zinc-800/50">
                    <td className="px-3 py-2.5 font-medium text-zinc-100">{c.nombre}</td>
                    <td className="px-3 py-2.5 text-zinc-400">{c.telefono || "—"}</td>
                    <td className="px-3 py-2.5 text-zinc-400">{c.email || "—"}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex justify-end gap-1 opacity-100 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
                        <button
                          onClick={() => openEdit(c)}
                          aria-label="Editar"
                          className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          <Pencil className="h-3 w-3" /> Editar
                        </button>
                        <button
                          onClick={() => setConfirm(c)}
                          aria-label="Eliminar"
                          className="inline-flex items-center gap-1 rounded-md bg-red-600/20 px-2 py-1 text-xs text-red-400 hover:bg-red-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} title={editing ? "Editar cliente" : "Nuevo cliente"} onClose={() => setDialogOpen(false)}>
        <form onSubmit={onSubmit} noValidate className="space-y-3">
          <Field label="Nombre *" id="cliente-nombre" error={fieldError ?? undefined}>
            <input
              id="cliente-nombre"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              required
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? "cliente-nombre-error" : undefined}
              className={inputClassName(!!fieldError)}
              placeholder="Juan Pérez"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Teléfono" id="cliente-telefono">
              <input
                id="cliente-telefono"
                value={form.telefono}
                onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
                className={inputClassName()}
                placeholder="11 5555-0000"
              />
            </Field>
            <Field label="Email" id="cliente-email">
              <input
                id="cliente-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className={inputClassName()}
                placeholder="juan@mail.com"
              />
            </Field>
          </div>
          <Field label="Dirección" id="cliente-direccion">
            <input
              id="cliente-direccion"
              value={form.direccion}
              onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
              className={inputClassName()}
            />
          </Field>
          <Field label="Notas" id="cliente-notas">
            <textarea
              id="cliente-notas"
              value={form.notas}
              onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
              rows={2}
              className={inputClassName()}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
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
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              {editing ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        title="¿Eliminar cliente?"
        description={confirm ? `Se eliminará a ${confirm.nombre}.` : undefined}
        onClose={() => !deleting && setConfirm(null)}
        onConfirm={onDelete}
      />
    </div>
  )
}

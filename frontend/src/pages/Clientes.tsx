import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { api, ApiError } from "../api/client"
import type { Cliente } from "../api/types"
import { Card } from "../components/Card"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { Empty } from "../components/Empty"
import { Field, inputClassName } from "../components/Field"

type FormState = { nombre: string; telefono: string; email: string; direccion: string; notas: string }

const emptyForm: FormState = { nombre: "", telefono: "", email: "", direccion: "", notas: "" }

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editing, setEditing] = useState<Cliente | null>(null)
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

  function startCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFieldError(null)
  }

  function startEdit(c: Cliente) {
    setEditing(c)
    setForm({ nombre: c.nombre, telefono: c.telefono, email: c.email, direccion: c.direccion, notas: c.notas })
    setFieldError(null)
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
      if (editing) {
        await api(`/api/clientes/${editing.id}`, { method: "PUT", body: form })
      } else {
        await api("/api/clientes", { method: "POST", body: form })
      }
      setForm(emptyForm)
      setEditing(null)
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-zinc-100">Clientes</h1>
        <button
          onClick={startCreate}
          className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          Nuevo cliente
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-950/50 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      <Card>
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
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              {editing ? "Actualizar" : "Crear"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={startCreate}
                className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
        </div>
      ) : clientes.length === 0 ? (
        <Empty title="Sin clientes" description="Creá tu primer cliente con el formulario arriba." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
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
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-800/50">
                  <td className="px-3 py-2 text-zinc-100">{c.nombre}</td>
                  <td className="px-3 py-2 text-zinc-400">{c.telefono || "—"}</td>
                  <td className="px-3 py-2 text-zinc-400">{c.email || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => startEdit(c)}
                        className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirm(c)}
                        className="rounded-md bg-red-600/20 px-2 py-1 text-xs text-red-400 hover:bg-red-600/30"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="¿Eliminar cliente?"
        description={confirm ? `Se eliminará a ${confirm.nombre}.` : undefined}
        onClose={() => !deleting && setConfirm(null)}
        onConfirm={onDelete}
      />
      {deleting && <span className="sr-only">Eliminando...</span>}
    </div>
  )
}

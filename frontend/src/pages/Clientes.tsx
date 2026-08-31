import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronUp, Loader2, Pencil, Plus, RotateCw, Search, Trash2 } from "lucide-react"
import { api, ApiError } from "../api/client"
import type { Cliente } from "../api/types"
import { Card } from "../components/Card"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { Dialog } from "../components/Dialog"
import { Field } from "../components/Field"
import { inputClassName } from "../components/inputStyles"
import { MotosManager } from "../components/MotosManager"

type FormState = { nombre: string; telefono: string; email: string; direccion: string; notas: string }
const emptyForm: FormState = { nombre: "", telefono: "", email: "", direccion: "", notas: "" }

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
  const [showMore, setShowMore] = useState(false)
  const [confirm, setConfirm] = useState<Cliente | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchClientes() {
    const data = await api<Cliente[]>("/api/clientes")
    setClientes(data ?? [])
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      await fetchClientes()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error cargando clientes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api<Cliente[]>("/api/clientes")
        if (!cancelled) setClientes(data ?? [])
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Error cargando clientes")
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
    if (!term) return clientes
    return clientes.filter((c) => [c.nombre, c.telefono, c.email].some((v) => v.toLowerCase().includes(term)))
  }, [clientes, q])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFieldError(null)
    setShowMore(false)
    setDialogOpen(true)
  }

  function openEdit(c: Cliente) {
    setEditing(c)
    setForm({ nombre: c.nombre, telefono: c.telefono, email: c.email, direccion: c.direccion, notas: c.notas })
    setFieldError(null)
    setShowMore(!!(c.direccion || c.notas))
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

  const showSearch = !loading && (clientes.length > 0 || q.length > 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="flex items-baseline gap-2 text-sm font-semibold text-zinc-100">
          Clientes
          {!loading && clientes.length > 0 && (
            <span role="status" className="text-xs font-normal text-zinc-500">
              {q.trim() ? `${filtered.length} de ${clientes.length}` : clientes.length}
            </span>
          )}
        </h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          <Plus className="h-3.5 w-3.5" /> Nuevo
        </button>
      </div>

      {error && clientes.length > 0 && (
        <p role="alert" className="rounded-md bg-red-950/50 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      {showSearch && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente"
            inputMode="search"
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-1.5 pl-8 pr-2.5 text-base text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:text-xs"
          />
        </div>
      )}

      <Card className="overflow-hidden border-zinc-800 p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando clientes...
          </div>
        ) : error && clientes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-zinc-200">No se pudieron cargar los clientes</p>
            <p className="mt-1 text-xs text-zinc-500">{error}</p>
            <button
              onClick={load}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-400"
            >
              <RotateCw className="h-3.5 w-3.5" /> Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-zinc-200">{q ? "Sin resultados" : "Aún no hay clientes"}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {q ? "Probá con otro nombre o teléfono." : "Agregá tu primer cliente para registrar motos y órdenes."}
            </p>
            {!q && (
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-400"
              >
                <Plus className="h-3.5 w-3.5" /> Nuevo cliente
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Cliente</th>
                    <th className="px-3 py-2 font-medium">Contacto</th>
                    <th className="w-20 px-3 py-2 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-800/40">
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-zinc-100">{c.nombre}</div>
                        {c.email && <div className="truncate text-xs text-zinc-500">{c.email}</div>}
                      </td>
                      <td className="px-3 py-2.5 text-zinc-400">{c.telefono || "—"}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <MotosManager cliente={c} />
                          <button
                            onClick={() => openEdit(c)}
                            aria-label={`Editar ${c.nombre}`}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirm(c)}
                            aria-label={`Eliminar ${c.nombre}`}
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
              {filtered.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-100">{c.nombre}</div>
                    <div className="truncate text-xs text-zinc-500">{c.telefono || c.email || "—"}</div>
                    <div className="mt-2"><MotosManager cliente={c} /></div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => openEdit(c)}
                      aria-label={`Editar ${c.nombre}`}
                      className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirm(c)}
                      aria-label={`Eliminar ${c.nombre}`}
                      className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-zinc-400 hover:bg-red-950/50 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
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
              autoFocus
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Teléfono" id="cliente-telefono">
              <input
                id="cliente-telefono"
                value={form.telefono}
                inputMode="tel"
                onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
                className={inputClassName()}
                placeholder="11 5555-0000"
              />
            </Field>
            <Field label="Email" id="cliente-email">
              <input
                id="cliente-email"
                type="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className={inputClassName()}
                placeholder="juan@mail.com"
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
          >
            {showMore ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showMore ? "Menos datos" : "Más datos"}
          </button>
          {showMore && (
            <div className="motek-enter space-y-3">
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
            </div>
          )}

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
        description={confirm ? `${confirm.nombre} será eliminado.` : undefined}
        onClose={() => !deleting && setConfirm(null)}
        onConfirm={onDelete}
      />
    </div>
  )
}

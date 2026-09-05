import { useEffect, useMemo, useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { api, ApiError } from "../api/client"
import type { Cliente } from "../api/types"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { Dialog } from "../components/Dialog"
import { Form, FormActions, FormGrid } from "../components/ui/Form"
import { Field } from "../components/Field"
import { inputClassName } from "../components/inputStyles"
import { MotosManager } from "../components/MotosManager"
import { DataCard, InlineError, PageHeader } from "../components/PageShell"
import { PageStack } from "../components/layout/PageStack"
import { SearchInput } from "../components/ui/SearchInput"
import { MobileList, Table, Tbody, Th, Thead, Td, Tr } from "../components/ui/Table"
import { useToast } from "../components/toastContext"
import { buttonClassName } from "../components/buttonStyles"

type FormState = { nombre: string; telefono: string; email: string; direccion: string; notas: string }
const emptyForm: FormState = { nombre: "", telefono: "", email: "", direccion: "", notas: "" }

export function Clientes() {
  const toast = useToast()
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
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFieldError("Email inválido")
      return
    }
    setFieldError(null)
    setSaving(true)
    const isEdit = !!editing
    try {
      if (editing) await api(`/api/clientes/${editing.id}`, { method: "PUT", body: form })
      else await api("/api/clientes", { method: "POST", body: form })
      setDialogOpen(false)
      setEditing(null)
      setForm(emptyForm)
      toast.success(isEdit ? "Cliente actualizado" : "Cliente creado")
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
      toast.success("Cliente eliminado")
      await load()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error eliminando cliente")
    } finally {
      setDeleting(false)
    }
  }

  const showSearch = !loading && (clientes.length > 0 || q.length > 0)

  const headerCount = !loading && clientes.length > 0 ? (q.trim() ? `${filtered.length} de ${clientes.length}` : clientes.length) : undefined
  const empty = filtered.length === 0
    ? {
        title: q ? "Sin resultados" : "Aún no hay clientes",
        description: q ? "Probá con otro nombre o teléfono." : "Agregá tu primer cliente para registrar motos y órdenes.",
        action: !q ? (
          <button onClick={openCreate} className={buttonClassName("primary")}>
            <Plus className="h-3.5 w-3.5" /> Nuevo cliente
          </button>
        ) : undefined,
      }
    : null

  return (
    <>
      <PageStack>
      <PageHeader
        title="Clientes"
        count={headerCount}
        action={
          <button onClick={openCreate} className={buttonClassName("primary")}>
            <Plus className="h-3.5 w-3.5" /> Nuevo
          </button>
        }
      />

      {error && clientes.length > 0 && <InlineError message={error} />}

      {showSearch && <SearchInput value={q} onChange={setQ} placeholder="Buscar cliente" />}

      <DataCard
        loading={loading}
        loadingText="Cargando clientes..."
        error={error}
        errorTitle="No se pudieron cargar los clientes"
        onRetry={load}
        empty={empty}
      >
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Cliente</Th>
                <Th>Contacto</Th>
                <Th className="w-20 text-right"></Th>
              </tr>
            </Thead>
            <Tbody>
              {filtered.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <div className="font-medium text-zinc-100">{c.nombre}</div>
                    {c.email && <div className="truncate text-xs text-zinc-500">{c.email}</div>}
                  </Td>
                  <Td className="text-zinc-400">{c.telefono || "—"}</Td>
                  <Td>
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
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <MobileList>
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
          </MobileList>
        </>
      </DataCard>
      </PageStack>

      <Dialog open={dialogOpen} title={editing ? "Editar cliente" : "Nuevo cliente"} dismissible={!saving} onClose={() => setDialogOpen(false)}>
        <Form onSubmit={onSubmit}>
          <Field label="Nombre *" id="cliente-nombre" error={fieldError ?? undefined}>
            <input
              id="cliente-nombre"
              value={form.nombre}
              onChange={(e) => {
                setForm((p) => ({ ...p, nombre: e.target.value }))
                if (fieldError) setFieldError(null)
              }}
              required
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? "cliente-nombre-error" : undefined}
              className={inputClassName(!!fieldError)}
              placeholder="Juan Pérez"
              autoFocus
            />
          </Field>
          <FormGrid>
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
          </FormGrid>
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

      <ConfirmDialog
        open={!!confirm}
        title="¿Eliminar cliente?"
        description={confirm ? `${confirm.nombre} será eliminado.` : undefined}
        busy={deleting}
        onClose={() => !deleting && setConfirm(null)}
        onConfirm={onDelete}
      />
    </>
  )
}

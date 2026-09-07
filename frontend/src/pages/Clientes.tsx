import { useMemo, useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { api } from "../api/client"
import type { Cliente } from "../api/types"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { Dialog } from "../components/Dialog"
import { Alert } from "../components/ui/Alert"
import { Form, FormActions, FormGrid } from "../components/ui/Form"
import { Field } from "../components/Field"
import { inputClassName } from "../components/inputStyles"
import { MotosManager } from "../components/MotosManager"
import { DataCard, InlineError, PageHeader } from "../components/PageShell"
import { PageStack } from "../components/layout/PageStack"
import { SearchInput } from "../components/ui/SearchInput"
import { RowActions } from "../components/ui/RowActions"
import { MobileList, Table, Tbody, Th, Thead, Td, Tr } from "../components/ui/Table"
import { useToast } from "../components/toastContext"
import { buttonClassName } from "../components/buttonStyles"
import { useCollection } from "../hooks/useCollection"
import { getErrorMessage } from "../lib/errors"
import { isValidEmail, required } from "../lib/validate"

type FormState = { nombre: string; telefono: string; email: string; direccion: string; notas: string }
const emptyForm: FormState = { nombre: "", telefono: "", email: "", direccion: "", notas: "" }

export function Clientes() {
  const toast = useToast()
  const { items: clientes, loading, error, setError, load, refresh } = useCollection<Cliente>("/api/clientes", "Error cargando clientes")
  const [q, setQ] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<{ nombre?: string; email?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<Cliente | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return clientes
    return clientes.filter((c) => [c.nombre, c.telefono, c.email].some((v) => v.toLowerCase().includes(term)))
  }, [clientes, q])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFieldErrors({})
    setFormError(null)
    setDialogOpen(true)
  }

  function openEdit(c: Cliente) {
    setEditing(c)
    setForm({ nombre: c.nombre, telefono: c.telefono, email: c.email, direccion: c.direccion, notas: c.notas })
    setFieldErrors({})
    setFormError(null)
    setDialogOpen(true)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof fieldErrors = {}
    const nombreError = required(form.nombre, "Nombre es requerido")
    if (nombreError) next.nombre = nombreError
    if (form.email && !isValidEmail(form.email)) next.email = "Email inválido"
    setFieldErrors(next)
    if (next.nombre || next.email) return
    setFormError(null)
    setSaving(true)
    const isEdit = !!editing
    try {
      if (editing) await api(`/api/clientes/${editing.id}`, { method: "PUT", body: form })
      else await api("/api/clientes", { method: "POST", body: form })
      setDialogOpen(false)
      setEditing(null)
      setForm(emptyForm)
      toast.success(isEdit ? "Cliente actualizado" : "Cliente creado")
      await refresh()
    } catch (e) {
      setFormError(getErrorMessage(e, "Error guardando cliente"))
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
      await refresh()
    } catch (e) {
      setError(getErrorMessage(e, "Error eliminando cliente"))
    } finally {
      setDeleting(false)
    }
  }

  const headerCount = !loading && clientes.length > 0 ? (q.trim() ? `${filtered.length} de ${clientes.length}` : clientes.length) : undefined
  const empty = filtered.length === 0
    ? {
        title: q ? "Sin resultados" : "Aún no hay clientes",
        description: q ? "Probá con otro nombre o teléfono." : "Registrá el dueño de la moto para abrir su ficha y cargar trabajos.",
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
            <Plus className="h-3.5 w-3.5" /> Nuevo cliente
          </button>
        }
      />

      {error && clientes.length > 0 && <InlineError message={error} />}

      <DataCard
        loading={loading}
        loadingText="Cargando clientes..."
        error={error}
        errorTitle="No se pudieron cargar los clientes"
        onRetry={load}
        empty={empty}
        toolbar={<SearchInput value={q} onChange={setQ} placeholder="Buscar cliente" />}
      >
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Cliente</Th>
                <Th>Contacto</Th>
                <Th className="w-28 text-right"><span className="sr-only">Acciones</span></Th>
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
                    <RowActions
                      extra={<MotosManager cliente={c} />}
                      onEdit={() => openEdit(c)}
                      editLabel={`Editar ${c.nombre}`}
                      onDelete={() => setConfirm(c)}
                      deleteLabel={`Eliminar ${c.nombre}`}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <MobileList>
            {filtered.map((c) => (
              <li key={c.id} className="flex min-w-0 items-center justify-between gap-3 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-100">{c.nombre}</div>
                  <div className="truncate text-xs text-zinc-500">{c.telefono || c.email || "—"}</div>
                </div>
                <RowActions
                  variant="card"
                  extra={<MotosManager cliente={c} />}
                  onEdit={() => openEdit(c)}
                  editLabel={`Editar ${c.nombre}`}
                  onDelete={() => setConfirm(c)}
                  deleteLabel={`Eliminar ${c.nombre}`}
                />
              </li>
            ))}
          </MobileList>
        </>
      </DataCard>
      </PageStack>

      <Dialog open={dialogOpen} title={editing ? "Editar cliente" : "Nuevo cliente"} dismissible={!saving} onClose={() => setDialogOpen(false)}>
        <Form onSubmit={onSubmit}>
          {formError && <Alert>{formError}</Alert>}
          <Field label="Nombre *" id="cliente-nombre" error={fieldErrors.nombre}>
            <input
              id="cliente-nombre"
              name="name"
              autoComplete="name"
              value={form.nombre}
              onChange={(e) => {
                setForm((p) => ({ ...p, nombre: e.target.value }))
                if (fieldErrors.nombre) setFieldErrors((p) => ({ ...p, nombre: undefined }))
              }}
              required
              aria-invalid={!!fieldErrors.nombre}
              aria-describedby={fieldErrors.nombre ? "cliente-nombre-error" : undefined}
              className={inputClassName(!!fieldErrors.nombre)}
              placeholder="Juan Pérez"
            />
          </Field>
          <FormGrid>
            <Field label="Teléfono" id="cliente-telefono">
              <input
                id="cliente-telefono"
                name="tel"
                autoComplete="tel"
                value={form.telefono}
                inputMode="tel"
                onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
                className={inputClassName()}
                placeholder="11 5555-0000"
              />
            </Field>
            <Field label="Email" id="cliente-email" error={fieldErrors.email}>
              <input
                id="cliente-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => {
                  setForm((p) => ({ ...p, email: e.target.value }))
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }))
                }}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "cliente-email-error" : undefined}
                className={inputClassName(!!fieldErrors.email)}
                placeholder="juan@mail.com"
              />
            </Field>
          </FormGrid>
          <Field label="Dirección" id="cliente-direccion">
            <input
              id="cliente-direccion"
              name="street-address"
              autoComplete="street-address"
              value={form.direccion}
              onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
              className={inputClassName()}
            />
          </Field>
          <Field label="Notas" id="cliente-notas">
            <textarea
              id="cliente-notas"
              name="notes"
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

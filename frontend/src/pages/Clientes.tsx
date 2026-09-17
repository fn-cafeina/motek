import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { api } from "../api/client"
import type { Cliente, Moto } from "../api/types"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { Dialog } from "../components/Dialog"
import { Alert } from "../components/ui/Alert"
import { Form, FormActions, FormGrid } from "../components/ui/Form"
import { Field } from "../components/Field"
import { inputClassName } from "../components/inputStyles"
import { MotosManager } from "../components/MotosManager"
import { DataCard, InlineError } from "../components/PageShell"
import { PageStack } from "../components/layout/PageStack"
import { FilterBar } from "../components/ui/FilterBar"
import { SearchInput } from "../components/ui/SearchInput"
import { RowActions } from "../components/ui/RowActions"
import { Spinner } from "../components/ui/Spinner"
import { MobileList, Table, Tbody, Th, Thead, Td, Tr } from "../components/ui/Table"
import { useToast } from "../components/toastContext"
import { buttonClassName } from "../components/buttonStyles"
import { useResumen } from "../contexts/resumenContext"
import { useCollection } from "../hooks/useCollection"
import { textoContador } from "../lib/contador"
import { getErrorMessage } from "../lib/errors"
import { isValidEmail, required } from "../lib/validate"

type FormState = { nombre: string; telefono: string; email: string; direccion: string; notas: string }
const emptyForm: FormState = { nombre: "", telefono: "", email: "", direccion: "", notas: "" }

/** Lo que se lleva puesto borrar un cliente, para poder avisarlo antes. */
type AlcanceBorrado = { motos: number; ordenes: number; facturas: number }

export function Clientes() {
  const toast = useToast()
  const { ordenes, facturas } = useResumen()
  const { items: clientes, loading, error, load, refresh } = useCollection<Cliente>("/api/clientes", "Error cargando clientes")
  const [q, setQ] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<{ nombre?: string; email?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<Cliente | null>(null)
  const [alcance, setAlcance] = useState<AlcanceBorrado | null>(null)
  const [deleting, setDeleting] = useState(false)

  // El contador de motos de cada fila tiene que estar antes de abrir el modal, y el
  // endpoint por cliente obligaría a una request por fila: se traen todas de una vez
  // y se agrupan acá. El modal carga las suyas aparte y sigue funcionando igual.
  const { items: motos, refresh: refreshMotos } = useCollection<Moto>("/api/motos", "Error cargando motos")
  const motosPorCliente = useMemo(() => {
    const conteo = new Map<number, number>()
    for (const moto of motos) {
      conteo.set(moto.cliente_id, (conteo.get(moto.cliente_id) ?? 0) + 1)
    }
    return conteo
  }, [motos])

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

  // Antes de ofrecer el borrado se averigua qué se lleva puesto: las motos y las
  // órdenes caen por cascada, y una factura emitida lo impide del todo.
  async function pedirConfirmacion(c: Cliente) {
    setConfirm(c)
    setAlcance(null)
    try {
      const motos = await api<Moto[]>(`/api/clientes/${c.id}/motos`)
      const propias = ordenes.filter((o) => o.cliente_id === c.id)
      const ids = new Set(propias.map((o) => o.id))
      setAlcance({
        motos: (motos ?? []).length,
        ordenes: propias.length,
        facturas: facturas.filter((f) => ids.has(f.orden_id)).length,
      })
    } catch {
      // Si no se pudo averiguar, se ofrece igual y el servidor decide.
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
      toast.error(getErrorMessage(e, "Error eliminando cliente"))
    } finally {
      setDeleting(false)
    }
  }

  const searchTerm = q.trim()
  const countLabel = loading
    ? undefined
    : textoContador(filtered.length, clientes.length, searchTerm !== "", "cliente", "clientes")
  const empty = filtered.length === 0
    ? {
        title: searchTerm ? "Sin resultados" : "Aún no hay clientes",
        description: searchTerm
          ? "Probá con otro nombre, teléfono o email."
          : "Cargá el dueño de la moto para poder abrir órdenes de trabajo a su nombre.",
      }
    : null

  const partes: string[] = []
  if (alcance?.motos) partes.push(`${alcance.motos} ${alcance.motos === 1 ? "moto" : "motos"}`)
  if (alcance?.ordenes) partes.push(`${alcance.ordenes} ${alcance.ordenes === 1 ? "orden de trabajo" : "órdenes de trabajo"}`)
  const bloqueado = !!alcance && alcance.facturas > 0

  return (
    <>
      <PageStack>
      {error && clientes.length > 0 && <InlineError message={error} />}

      <DataCard
        loading={loading}
        loadingText="Cargando clientes"
        error={error}
        errorTitle="No se pudieron cargar los clientes"
        onRetry={load}
        empty={empty}
        toolbar={
          <FilterBar>
            <SearchInput value={q} onChange={setQ} placeholder="Buscar cliente" />
            <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-end">
              {countLabel && <span className="whitespace-nowrap text-[12px] text-muted">{countLabel}</span>}
              <button onClick={openCreate} className={buttonClassName("primary")}>
                <Plus className="h-4 w-4" aria-hidden /> Nuevo cliente
              </button>
            </div>
          </FilterBar>
        }
      >
        <>
          <Table caption="Clientes registrados">
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
                    <div className="font-medium text-fg">{c.nombre}</div>
                    {c.email && <div className="truncate text-[12px] text-subtle">{c.email}</div>}
                  </Td>
                  <Td className="text-muted">{c.telefono || "—"}</Td>
                  <Td>
                    <RowActions
                      extra={
                        <MotosManager
                          cliente={c}
                          motoCount={motosPorCliente.get(c.id) ?? 0}
                          onMotosChange={refreshMotos}
                        />
                      }
                      onEdit={() => openEdit(c)}
                      editLabel={`Editar ${c.nombre}`}
                      onDelete={() => pedirConfirmacion(c)}
                      deleteLabel={`Eliminar ${c.nombre}`}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <MobileList>
            {filtered.map((c) => (
              <li key={c.id} className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-fg">{c.nombre}</div>
                  <div className="truncate text-[12px] text-muted">{c.telefono || c.email || "—"}</div>
                </div>
                <RowActions
                  variant="card"
                  extra={
                    <MotosManager
                      cliente={c}
                      motoCount={motosPorCliente.get(c.id) ?? 0}
                      onMotosChange={refreshMotos}
                    />
                  }
                  onEdit={() => openEdit(c)}
                  editLabel={`Editar ${c.nombre}`}
                  onDelete={() => pedirConfirmacion(c)}
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
          {formError && (
            <Alert tone="danger" live>
              {formError}
            </Alert>
          )}
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
              {saving && <Spinner />}
              {editing ? "Guardar" : "Crear"}
            </button>
          </FormActions>
        </Form>
      </Dialog>

      <ConfirmDialog
        open={!!confirm}
        title="¿Eliminar cliente?"
        description={
          confirm && (
            <>
              <p>{confirm.nombre} se va a eliminar.</p>
              {!bloqueado && partes.length > 0 && (
                <p>
                  {partes.length === 1 ? "También se borra" : "También se borran"}{" "}
                  <span className="font-medium text-fg">{partes.join(" y ")}</span>.
                </p>
              )}
            </>
          )
        }
        blocked={
          bloqueado
            ? {
                title: "Tiene facturas emitidas",
                description:
                  "No se puede eliminar mientras existan facturas de sus órdenes, para no perder el historial de facturación.",
              }
            : undefined
        }
        busy={deleting}
        onClose={() => !deleting && setConfirm(null)}
        onConfirm={onDelete}
      />
    </>
  )
}

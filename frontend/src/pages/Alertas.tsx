import { useMemo, useState } from "react"
import { Loader2, PackagePlus, RotateCw } from "lucide-react"
import { api } from "../api/client"
import type { AlertaStock } from "../api/types"
import { Dialog } from "../components/Dialog"
import { Form, FormActions } from "../components/ui/Form"
import { Field } from "../components/Field"
import { Alert } from "../components/ui/Alert"
import { inputClassName } from "../components/inputStyles"
import { DataCard, EmptyCheckIcon, InlineError } from "../components/PageShell"
import { PageStack } from "../components/layout/PageStack"
import { FilterBar } from "../components/ui/FilterBar"
import { SearchInput } from "../components/ui/SearchInput"
import { RowActions } from "../components/ui/RowActions"
import { MobileList, Table, Tbody, Th, Thead, Td, Tr } from "../components/ui/Table"
import { useToast } from "../components/toastContext"
import { buttonClassName } from "../components/buttonStyles"
import { useCollection } from "../hooks/useCollection"
import { textoContador } from "../lib/contador"
import { getErrorMessage } from "../lib/errors"

export function Alertas() {
  const toast = useToast()
  const { items, setItems, loading, error, load } = useCollection<AlertaStock>("/api/alertas/stock", "Error cargando alertas")
  const [q, setQ] = useState("")
  const [target, setTarget] = useState<AlertaStock | null>(null)
  const [delta, setDelta] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return items
    return items.filter((a) => [a.nombre, a.codigo].some((v) => v.toLowerCase().includes(term)))
  }, [items, q])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!target) return
    const cant = Number(delta)
    if (!cant) {
      setFormError("Ingresá una cantidad")
      return
    }
    setFormError(null)
    setSaving(true)
    try {
      const res = await api<{ stock: number }>(`/api/repuestos/${target.id}/stock`, {
        method: "POST",
        body: { cantidad: cant },
      })
      setTarget(null)
      setDelta("")
      toast.success("Stock actualizado")
      if (res.stock > target.stock_minimo) await load()
      else setItems((prev) => prev.map((a) => (a.id === target.id ? { ...a, stock: res.stock } : a)))
    } catch (e) {
      setFormError(getErrorMessage(e, "Error ajustando stock"))
    } finally {
      setSaving(false)
    }
  }

  const searchTerm = q.trim()
  const countLabel = loading
    ? undefined
    : textoContador(filtered.length, items.length, searchTerm !== "", "repuesto", "repuestos")

  const empty = filtered.length === 0
    ? q
      ? {
          title: "Sin resultados",
          description: "Probá con otro código o nombre.",
          action: (
            <button onClick={() => setQ("")} className={buttonClassName("secondary")}>
              Limpiar filtros
            </button>
          ),
        }
      : {
          title: "Todo en stock",
          description: "No hay repuestos por debajo del mínimo.",
          icon: <EmptyCheckIcon />,
        }
    : null

  return (
    <>
      <PageStack>
        {error && items.length > 0 && <InlineError message={error} />}

        <DataCard
          loading={loading}
          loadingText="Cargando alertas"
          error={error}
          errorTitle="No se pudieron cargar las alertas"
          onRetry={load}
          empty={empty}
          toolbar={
            <FilterBar>
              <SearchInput value={q} onChange={setQ} placeholder="Buscar por código o nombre" />
              <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-end">
                {countLabel && (
                  <span className="whitespace-nowrap text-[12px] text-muted">{countLabel}</span>
                )}
                <button onClick={load} className={buttonClassName("secondary")}>
                  <RotateCw className="h-4 w-4" aria-hidden /> Actualizar
                </button>
              </div>
            </FilterBar>
          }
        >
          <>
            <Table caption="Repuestos por debajo del stock mínimo">
              <Thead>
                <tr>
                  <Th>Repuesto</Th>
                  <Th align="right">Stock</Th>
                  <Th align="right">Mínimo</Th>
                  <Th className="w-28" align="right">
                    <span className="sr-only">Acciones</span>
                  </Th>
                </tr>
              </Thead>
              <Tbody>
                {filtered.map((a) => (
                  <Tr key={a.id}>
                    <Td>
                      <div className="font-medium text-fg">{a.nombre || a.codigo}</div>
                      <div className="text-[12px] text-subtle">{a.codigo}</div>
                    </Td>
                    <Td align="right" className="font-semibold text-accent">{a.stock}</Td>
                    <Td align="right" className="text-muted">{a.stock_minimo}</Td>
                    <Td>
                      <RowActions
                        actions={[{ onClick: () => { setTarget(a); setDelta(""); setFormError(null) }, label: `Surtir ${a.nombre || a.codigo}`, icon: <PackagePlus className="size-3.5" />, tone: "info" }]}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <MobileList>
              {filtered.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-fg">{a.nombre || a.codigo}</div>
                    <div className="truncate text-[12px] text-muted">
                      {a.codigo} ·{" "}
                      <span className="font-semibold tabular-nums text-accent">{a.stock}</span> de {a.stock_minimo} mín.
                    </div>
                  </div>
                  <RowActions
                    variant="card"
                    actions={[{ onClick: () => { setTarget(a); setDelta(""); setFormError(null) }, label: `Surtir ${a.nombre || a.codigo}`, icon: <PackagePlus className="size-3.5" />, tone: "info" }]}
                  />
                </li>
              ))}
            </MobileList>
          </>
        </DataCard>
      </PageStack>

      <Dialog
        open={!!target}
        title={target ? `Surtir: ${target.nombre || target.codigo}` : "Surtir"}
        dismissible={!saving} onClose={() => setTarget(null)}
      >
        <Form onSubmit={onSubmit}>
          <p className="text-[13px] text-muted">
            Stock actual: <span className="font-semibold tabular-nums text-accent">{target?.stock ?? 0}</span>
            {" · "}Mínimo: <span className="tabular-nums text-fg">{target?.stock_minimo ?? 0}</span>
          </p>
          {formError && (
            <Alert tone="danger" live>
              {formError}
            </Alert>
          )}
          <Field label="Cantidad a sumar" id="alerta-cantidad">
            <input
              id="alerta-cantidad"
              value={delta}
              inputMode="numeric"
              onChange={(e) => {
                setDelta(e.target.value)
                if (formError) setFormError(null)
              }}
              className={inputClassName(!!formError)}
              placeholder="10"
            />
          </Field>
          <FormActions>
            <button type="button" onClick={() => setTarget(null)} disabled={saving} className={buttonClassName("secondary")}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} aria-busy={saving} className={buttonClassName("primary")}>
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Surtir
            </button>
          </FormActions>
        </Form>
      </Dialog>
    </>
  )
}

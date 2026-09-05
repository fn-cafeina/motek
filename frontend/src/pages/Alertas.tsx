import { useEffect, useState } from "react"
import { Loader2, PackagePlus, RotateCw } from "lucide-react"
import { api, ApiError } from "../api/client"
import type { AlertaStock } from "../api/types"
import { Dialog } from "../components/Dialog"
import { Field } from "../components/Field"
import { inputClassName } from "../components/inputStyles"
import { DataCard, EmptyCheckIcon, InlineError, PageHeader } from "../components/PageShell"
import { PageStack } from "../components/layout/PageStack"
import { MobileList, Table, Tbody, Th, Thead, Td, Tr } from "../components/ui/Table"
import { useToast } from "../components/toastContext"
import { buttonClassName } from "../components/buttonStyles"

export function Alertas() {
  const toast = useToast()
  const [items, setItems] = useState<AlertaStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [target, setTarget] = useState<AlertaStock | null>(null)
  const [delta, setDelta] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await api<AlertaStock[]>("/api/alertas/stock")
      setItems(data ?? [])
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error cargando alertas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api<AlertaStock[]>("/api/alertas/stock")
        if (!cancelled) setItems(data ?? [])
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Error cargando alertas")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

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
      setFormError(e instanceof ApiError ? e.message : "Error ajustando stock")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageStack>
        <PageHeader
          title="Alertas de stock"
          count={!loading && items.length > 0 ? items.length : undefined}
          action={
            <button onClick={load} className={buttonClassName("secondary")}>
              <RotateCw className="h-3.5 w-3.5" /> Actualizar
            </button>
          }
        />

        {error && items.length > 0 && <InlineError message={error} />}

        <DataCard
          loading={loading}
          loadingText="Cargando alertas..."
          error={error}
          errorTitle="No se pudieron cargar las alertas"
          onRetry={load}
          empty={
            items.length === 0
              ? {
                  title: "Todo en stock",
                  description: "No hay repuestos por debajo del mínimo.",
                  icon: <EmptyCheckIcon />,
                }
              : null
          }
        >
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Repuesto</Th>
                  <Th className="text-right">Stock</Th>
                  <Th className="text-right">Mínimo</Th>
                  <Th className="w-16 text-right"></Th>
                </tr>
              </Thead>
              <Tbody>
                {items.map((a) => (
                  <Tr key={a.id}>
                    <Td>
                      <div className="font-medium text-zinc-100">{a.nombre || a.codigo}</div>
                      <div className="text-xs text-zinc-500">{a.codigo}</div>
                    </Td>
                    <Td className="text-right font-semibold text-red-400">{a.stock}</Td>
                    <Td className="text-right text-zinc-400">{a.stock_minimo}</Td>
                    <Td>
                      <div className="flex justify-end">
                        <button
                          onClick={() => { setTarget(a); setDelta(""); setFormError(null) }}
                          aria-label={`Surtir ${a.nombre || a.codigo}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-sky-400 hover:bg-sky-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          <PackagePlus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <MobileList>
              {items.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-100">{a.nombre || a.codigo}</div>
                    <div className="truncate text-xs text-zinc-500">
                      {a.codigo} · <span className="font-semibold text-red-400">{a.stock}</span> / {a.stock_minimo}
                    </div>
                  </div>
                  <button
                    onClick={() => { setTarget(a); setDelta(""); setFormError(null) }}
                    aria-label={`Surtir ${a.nombre || a.codigo}`}
                    className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-sky-400 hover:bg-sky-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <PackagePlus className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </MobileList>
          </>
        </DataCard>
      </PageStack>

      <Dialog
        open={!!target}
        title={target ? `Surtir: ${target.nombre || target.codigo}` : "Surtir"}
        onClose={() => (saving ? undefined : setTarget(null))}
      >
        <form onSubmit={onSubmit} noValidate className="space-y-3">
          <p className="text-xs text-zinc-400">
            Stock actual: <span className="font-semibold text-red-400">{target?.stock ?? 0}</span>
            {" · "}Mínimo: <span className="text-zinc-200">{target?.stock_minimo ?? 0}</span>
          </p>
          {formError && (
            <p role="alert" className="rounded-md bg-red-950/50 px-2.5 py-1.5 text-xs text-red-400">{formError}</p>
          )}
          <Field label="Cantidad a sumar" id="alerta-cantidad">
            <input
              id="alerta-cantidad"
              value={delta}
              inputMode="numeric"
              autoFocus
              onChange={(e) => {
                setDelta(e.target.value)
                if (formError) setFormError(null)
              }}
              className={inputClassName(!!formError)}
              placeholder="10"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setTarget(null)} disabled={saving} className={buttonClassName("secondary")}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} aria-busy={saving} className={buttonClassName("primary")}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              Surtir
            </button>
          </div>
        </form>
      </Dialog>
    </>
  )
}

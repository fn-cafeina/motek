const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

export function formatMoney(value: number): string {
  return moneyFormatter.format(value ?? 0)
}

export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—"
  // Date-only values arrive as UTC midnight (e.g. "2026-09-10T00:00:00Z" from a
  // date input); rendering them in local time (UTC-3) shifts the visible day.
  const dateOnly = /^\d{4}-\d{2}-\d{2}(T00:00:00(\.\d+)?Z)?$/.test(iso)
  const d = new Date(dateOnly ? `${iso.slice(0, 10)}T12:00:00` : iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function buildMap<T extends { id: number }>(items: T[]): Map<number, T> {
  return new Map(items.map((i) => [i.id, i]))
}

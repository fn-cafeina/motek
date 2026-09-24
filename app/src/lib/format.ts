const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number): string {
  return moneyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

export function formatFecha(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const dateOnly = /^\d{4}-\d{2}-\d{2}(T00:00:00(\.\d+)?Z)?$/.test(dateStr);
  const date = new Date(dateOnly ? `${dateStr.slice(0, 10)}T12:00:00` : dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function buildMap<T extends { id: number }>(items: T[]): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]));
}

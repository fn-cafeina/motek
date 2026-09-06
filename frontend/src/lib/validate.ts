export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function required(value: string, message: string): string | undefined {
  return value.trim() ? undefined : message
}

export function numberField(
  value: string,
  { label, allowEmpty = true }: { label: string; allowEmpty?: boolean },
): string | undefined {
  if (!value.trim()) return allowEmpty ? undefined : `${label} es requerido`
  const n = Number(value)
  if (Number.isNaN(n)) return `${label} debe ser un número`
  if (n < 0) return `${label} no puede ser negativo`
  return undefined
}

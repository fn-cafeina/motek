export function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function matchesSearch(value: string, fields: readonly (string | null | undefined)[]): boolean {
  const term = normalizeSearch(value);
  if (!term) return true;
  return fields.some((field) => (field ?? "").toLowerCase().includes(term));
}

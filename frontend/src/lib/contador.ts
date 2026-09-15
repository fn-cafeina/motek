/**
 * Frase única del contador de las toolbars. Sin filtro nombra el total; con filtro
 * aclara cuántos se están viendo de cuántos, en las cinco páginas por igual.
 */
export function textoContador(
  mostrados: number,
  total: number,
  filtrando: boolean,
  singular: string,
  plural: string,
): string {
  if (filtrando) return `${mostrados} de ${total}`
  return `${total} ${total === 1 ? singular : plural}`
}

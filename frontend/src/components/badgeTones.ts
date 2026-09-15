export type BadgeTone = "neutral" | "info" | "primary" | "accent" | "ok" | "danger"

export const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "border-border bg-raised text-muted",
  info: "border-info/25 bg-info-soft text-info",
  primary: "border-primary/25 bg-primary-soft text-primary",
  accent: "border-accent/25 bg-accent-soft text-accent",
  ok: "border-ok/25 bg-ok-soft text-ok",
  danger: "border-danger/25 bg-danger-soft text-danger",
}

const ESTADO_TONES: Record<string, BadgeTone> = {
  // órdenes de trabajo
  recibido: "info",
  en_progreso: "primary",
  esperando_repuestos: "accent",
  terminado: "ok",
  entregado: "neutral",
  // facturas
  pendiente: "accent",
  parcial: "info",
  pagada: "ok",
  cancelada: "neutral",
}

/** Clases de color de un tono, para reusar en controles que no son un chip. */
export function badgeToneClassName(tone: BadgeTone = "neutral"): string {
  return BADGE_TONES[tone]
}

export function estadoTone(estado: string): BadgeTone {
  return ESTADO_TONES[estado] ?? "neutral"
}

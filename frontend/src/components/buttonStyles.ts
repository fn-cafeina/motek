export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "dangerGhost" | "link"
export type ButtonSize = "sm" | "md"

// El foco lo dibuja el outline global de index.css: ningún botón agrega su propio
// anillo, así no hay dos indicadores superpuestos.
const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"

// 40px en móvil para el pulgar, 36px en desktop para no inflar las tablas.
const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-3 text-[13px] sm:h-9",
}

const VARIANTS: Record<Exclude<ButtonVariant, "link">, string> = {
  primary: "motek-press bg-primary font-semibold text-primary-fg hover:bg-primary-hover",
  secondary: "border border-border-strong bg-surface text-fg hover:bg-raised",
  ghost: "text-muted hover:bg-raised hover:text-fg",
  danger: "motek-press bg-danger font-semibold text-danger-fg hover:brightness-95",
  dangerGhost: "text-danger hover:bg-danger-soft",
}

export function buttonClassName(variant: ButtonVariant = "primary", size: ButtonSize = "md"): string {
  if (variant === "link") {
    return `${BASE} h-auto text-[13px] text-primary underline-offset-4 hover:underline`
  }
  return `${BASE} ${SIZES[size]} ${VARIANTS[variant]}`
}

// Los campos van a 16px en móvil: por debajo de eso iOS hace zoom al enfocar y
// descoloca el layout. En desktop bajan a 13px por densidad.
// El foco lo dibuja el outline global de index.css, igual que en los botones:
// `outline-none` acá lo cancelaba y dejaba un borde de 1px como único indicador.
const FIELD =
  "w-full rounded-md border border-border-strong bg-surface px-3 text-base text-fg placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-60 sm:text-[13px]"

export function inputClassName(invalid?: boolean) {
  return `${FIELD} h-10 sm:h-9 ${invalid ? "border-danger" : "focus:border-primary"}`
}

export function selectClassName(invalid?: boolean) {
  return inputClassName(invalid)
}

// Select compacto para celdas de tabla: neutro en reposo, con borde al pasar el mouse.
export function inlineSelectClassName() {
  return "h-7 max-w-[11rem] rounded-md border border-transparent bg-raised px-2 text-[13px] text-fg hover:border-border-strong focus:border-primary"
}

export function searchInputClassName() {
  return `${FIELD} h-10 pl-9 pr-8 focus:border-primary sm:h-9`
}

// Select de estado para celdas de tabla. Solo layout y tipografía: los colores los
// aporta el tono del estado, así no hay clases en conflicto.
export function estadoSelectClassName() {
  return "h-7 w-full max-w-[11rem] rounded-md border px-2 text-[12px] font-medium disabled:opacity-60"
}

// La marca es la palabra, no un ícono dentro de una caja: el taller tiene nombre
// propio y una llave genérica en un cuadrado no dice nada de motos. Con el menú
// contraído, la inicial hace de marca.
export function Brand({ subtitle, compact }: { subtitle?: string; compact?: boolean }) {
  if (compact) {
    return (
      <span className="motek-heading text-[20px] font-bold leading-none tracking-tight text-fg" aria-hidden>
        M
      </span>
    )
  }

  return (
    <span className="min-w-0 text-left">
      <span className="motek-heading block text-[20px] font-bold leading-none tracking-tight text-fg">Motek</span>
      {subtitle && <span className="mt-1 block truncate text-[11px] leading-tight text-muted">{subtitle}</span>}
    </span>
  )
}

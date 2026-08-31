type BadgeProps = {
  tone?: "amber" | "green" | "red" | "zinc" | "blue"
  children: React.ReactNode
}

const TONES: Record<NonNullable<BadgeProps["tone"]>, string> = {
  amber: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  red: "bg-red-500/15 text-red-400 border-red-500/30",
  zinc: "bg-zinc-700/40 text-zinc-300 border-zinc-600/40",
  blue: "bg-sky-500/15 text-sky-400 border-sky-500/30",
}

export function Badge({ tone = "zinc", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4 ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}

export function EstadoBadge({ estado }: { estado: string }) {
  let tone: BadgeProps["tone"] = "zinc"
  if (estado === "entregado" || estado === "pagada") tone = "green"
  else if (estado === "esperando_repuestos" || estado === "cancelada") tone = "red"
  else if (estado === "recibido" || estado === "pendiente") tone = "amber"
  else if (estado === "en_progreso" || estado === "parcial") tone = "blue"
  return <Badge tone={tone}>{estado}</Badge>
}

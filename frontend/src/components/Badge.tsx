import { facturaEstadoLabel, ordenEstadoLabel } from "../api/types"
import { badgeToneClassName, estadoTone, type BadgeTone } from "./badgeTones"

// El punto hereda el color del texto: el estado nunca se comunica solo por color.
export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-[12px] font-medium leading-5 ${badgeToneClassName(tone)}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  )
}

export function EstadoBadge({ estado }: { estado: string }) {
  const label = ordenEstadoLabel(estado) !== estado ? ordenEstadoLabel(estado) : facturaEstadoLabel(estado)
  return <Badge tone={estadoTone(estado)}>{label}</Badge>
}

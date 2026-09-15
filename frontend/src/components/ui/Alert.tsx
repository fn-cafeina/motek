import { AlertTriangle, Info, OctagonAlert } from "lucide-react"

export type AlertTone = "danger" | "accent" | "info"

const TONES: Record<AlertTone, { className: string; Icon: typeof Info }> = {
  danger: { className: "border-danger/25 bg-danger-soft text-danger", Icon: OctagonAlert },
  accent: { className: "border-accent/25 bg-accent-soft text-accent", Icon: AlertTriangle },
  info: { className: "border-info/25 bg-info-soft text-info", Icon: Info },
}

// `role="alert"` solo cuando el mensaje aparece por una acción del usuario; para
// texto ya presente en la página alcanza con el color y el icono.
export function Alert({
  children,
  tone = "danger",
  live = false,
}: {
  children: React.ReactNode
  tone?: AlertTone
  live?: boolean
}) {
  const { className, Icon } = TONES[tone]
  return (
    <p
      role={live ? "alert" : undefined}
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-[13px] leading-[1.5] ${className}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="min-w-0">{children}</span>
    </p>
  )
}

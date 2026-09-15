import { Link } from "react-router"

export type StatTone = "neutral" | "accent" | "ok" | "primary"

const VALUE_TONES: Record<StatTone, string> = {
  neutral: "text-fg",
  accent: "text-accent",
  ok: "text-ok",
  primary: "text-primary",
}

const SHELL = "flex flex-col gap-2 rounded-lg border border-border bg-surface p-4"

type StatCardProps = {
  label: string
  value: React.ReactNode
  hint?: string
  tone?: StatTone
  /** Si se pasa, la tarjeta entera es un enlace. No usar junto a contenido interactivo. */
  to?: string
  footer?: React.ReactNode
}

export function StatCard({ label, value, hint, tone = "neutral", to, footer }: StatCardProps) {
  const body = (
    <>
      <p className="text-[12px] font-medium text-muted">{label}</p>
      <p className={`text-[26px] font-semibold leading-none tracking-tight ${VALUE_TONES[tone]}`}>{value}</p>
      {hint && <p className="text-[12px] leading-[1.5] text-subtle">{hint}</p>}
      {footer && <div className="mt-1">{footer}</div>}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={`${SHELL} transition-colors hover:border-border-strong hover:bg-raised`}>
        {body}
      </Link>
    )
  }

  return <div className={SHELL}>{body}</div>
}

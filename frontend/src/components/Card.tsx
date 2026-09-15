// Superficie base del sistema. Sin padding propio: cada uso decide el suyo.
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-border bg-surface ${className}`}>{children}</div>
}

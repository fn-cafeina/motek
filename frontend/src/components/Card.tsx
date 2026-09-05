export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm shadow-black/20 ring-1 ring-white/[0.04] ${className}`}>{children}</div>
}

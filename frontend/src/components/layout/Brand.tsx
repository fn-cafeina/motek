export function Brand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="text-center">
      <span className="text-base font-bold tracking-tight text-zinc-100">
        <span className="text-amber-500">Mo</span>tek
      </span>
      {subtitle && <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>}
    </div>
  )
}

export function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h1 className="text-sm font-semibold text-zinc-100">{title}</h1>
      <p className="mt-1 text-xs text-zinc-500">Contenido próximamente</p>
    </div>
  )
}

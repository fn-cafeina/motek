export function Empty({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="motek-prose mx-auto rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-center">
      <p className="motek-heading text-[15px] font-semibold leading-[1.25] text-zinc-300">{title}</p>
      {description && <p className="mt-1.5 text-xs leading-[1.6] text-zinc-400">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function Form({ children, onSubmit }: { children: React.ReactNode; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      {children}
    </form>
  )
}

export function FormGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  return <div className={`grid gap-3 ${cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>{children}</div>
}

export function FormActions({ children }: { children: React.ReactNode }) {
  return <div className="sticky -bottom-3 -mx-3 -mb-3 flex justify-end gap-2 border-t border-zinc-800 bg-zinc-900 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:static sm:mx-0 sm:mb-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-2">{children}</div>
}

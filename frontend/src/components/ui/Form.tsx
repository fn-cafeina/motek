export function Form({ children, onSubmit }: { children: React.ReactNode; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {children}
    </form>
  )
}

export function FormGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  return (
    <div className={`grid gap-4 ${cols === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
      {children}
    </div>
  )
}

// En móvil queda pegado al borde inferior del diálogo; en desktop es una fila más.
export function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky -bottom-4 -mx-4 -mb-4 flex justify-end gap-2 border-t border-border bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:static sm:mx-0 sm:mb-0 sm:border-0 sm:px-0 sm:pb-0 sm:pt-1">
      {children}
    </div>
  )
}

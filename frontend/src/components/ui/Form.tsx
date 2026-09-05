export function Form({ children, onSubmit }: { children: React.ReactNode; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      {children}
    </form>
  )
}

export function FormGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  return <div className={`grid gap-3 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>{children}</div>
}

export function FormActions({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2 pt-2">{children}</div>
}

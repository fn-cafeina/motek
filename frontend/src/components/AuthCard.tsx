export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-5 text-center">
          <span className="text-xl font-bold tracking-tight text-zinc-100">
            <span className="text-amber-500">Mo</span>tek
          </span>
          <p className="mt-1 text-xs text-zinc-500">Taller especializado en motocicletas</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
          <h1 className="mb-4 text-sm font-semibold text-zinc-100">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}

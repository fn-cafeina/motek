export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm">
        <div className="motek-enter mb-4 text-center">
          <span className="text-lg font-bold tracking-tight text-zinc-100">
            <span className="text-amber-500">Mo</span>tek
          </span>
          <p className="mt-1 text-xs text-zinc-400">Taller especializado en motocicletas</p>
        </div>
        <div className="motek-enter-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm shadow-black/20 ring-1 ring-white/[0.04]">
          <h1 className="mb-3 text-sm font-semibold tracking-wide text-zinc-100">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}

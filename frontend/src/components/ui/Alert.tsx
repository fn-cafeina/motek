export function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-md bg-red-950/50 px-3 py-2 text-xs text-red-400">
      {children}
    </p>
  )
}

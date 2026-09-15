export function NavGroup({
  label,
  children,
  collapsed,
}: {
  label: string
  children: React.ReactNode
  collapsed?: boolean
}) {
  return (
    <div className="mb-4 last:mb-0">
      {collapsed ? (
        <div className="mx-2 mb-2 border-t border-border" aria-hidden />
      ) : (
        <p className="mb-1.5 px-2.5 text-[11px] font-semibold text-subtle">{label}</p>
      )}
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  )
}

export type EmptyStateProps = {
  title: React.ReactNode
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="motek-prose mx-auto px-6 py-12 text-center">
      {icon && (
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-raised text-muted">
          {icon}
        </div>
      )}
      <p className="motek-heading text-[15px] font-semibold leading-[1.3] text-fg">{title}</p>
      {description && <p className="mt-1.5 text-[13px] leading-[1.6] text-muted">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}

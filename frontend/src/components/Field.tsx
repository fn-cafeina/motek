type FieldProps = {
  label: string
  id: string
  error?: string
  /** Aclaración persistente. El error la reemplaza cuando aparece. */
  hint?: string
  rightSlot?: React.ReactNode
  children: React.ReactNode
}

export function Field({ label, id, error, hint, rightSlot, children }: FieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-[13px] font-medium text-muted">{label}</span>
      <div className="relative">
        {children}
        {rightSlot}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] leading-[1.4] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] leading-[1.4] text-subtle">
          {hint}
        </p>
      ) : null}
    </label>
  )
}

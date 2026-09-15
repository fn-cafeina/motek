type FieldProps = {
  label: string
  id: string
  error?: string
  rightSlot?: React.ReactNode
  children: React.ReactNode
}

export function Field({ label, id, error, rightSlot, children }: FieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-muted">{label}</span>
      <div className="relative">
        {children}
        {rightSlot}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] leading-[1.4] text-danger">
          {error}
        </p>
      )}
    </label>
  )
}

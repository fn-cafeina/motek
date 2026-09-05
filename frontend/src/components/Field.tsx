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
      <span className="text-xs font-medium tracking-wide text-zinc-300">{label}</span>
      <div className="relative mt-1">{children}{rightSlot}</div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </label>
  )
}


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
      <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{label}</span>
      <div className="relative mt-1.5">{children}{rightSlot}</div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs leading-[1.5] text-red-400">
          {error}
        </p>
      )}
    </label>
  )
}


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
      <span className="text-xs font-medium tracking-wide text-zinc-400">{label}</span>
      <div className="relative mt-1">{children}{rightSlot}</div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </label>
  )
}

export function inputClassName(invalid?: boolean) {
  return `w-full rounded-md border bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-400 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${invalid ? "border-red-500 focus:border-red-500 focus-visible:ring-red-500" : "border-zinc-700 focus:border-amber-500"}`
}

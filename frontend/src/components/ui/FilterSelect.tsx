import { selectClassName } from "../inputStyles"

type Option = { value: string; label: string }

export function FilterSelect({
  value,
  onChange,
  options,
  label,
  busy,
}: {
  value: string
  onChange: (v: string) => void
  options: Option[]
  label: string
  busy?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      aria-busy={busy}
      className={`${selectClassName()} sm:max-w-[13rem]`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

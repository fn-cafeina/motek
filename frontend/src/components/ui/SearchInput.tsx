import { Search } from "lucide-react"
import { searchInputClassName } from "../inputStyles"

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="search"
        className={searchInputClassName()}
      />
    </div>
  )
}

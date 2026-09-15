import { useId } from "react"
import { Search, X } from "lucide-react"
import { searchInputClassName } from "../inputStyles"

export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  label?: string
}) {
  const id = useId()
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        inputMode="search"
        className={`${searchInputClassName()} [&::-webkit-search-cancel-button]:hidden`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute inset-y-0 right-0 flex items-center px-2.5 text-subtle transition-colors hover:text-fg"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  )
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost"

const BASE = "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:py-1.5"

const VARIANTS: Record<ButtonVariant, string> = {
  primary: `${BASE} motek-press font-semibold bg-amber-500 text-zinc-900 hover:bg-amber-400 focus-visible:ring-amber-500 disabled:opacity-50`,
  secondary: `${BASE} bg-zinc-800 text-zinc-300 hover:bg-zinc-700 focus-visible:ring-amber-500 disabled:opacity-50`,
  danger: `${BASE} font-semibold bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500 disabled:opacity-50`,
  ghost: `${BASE} text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:ring-amber-500 disabled:opacity-50`,
}

export function buttonClassName(variant: ButtonVariant = "primary"): string {
  return VARIANTS[variant]
}

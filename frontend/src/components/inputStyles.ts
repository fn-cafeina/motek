const INPUT_BASE = "w-full rounded-md border bg-zinc-800 px-2.5 py-2 text-base text-zinc-100 placeholder:text-zinc-400 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-50 sm:py-1.5 sm:text-sm"

export function inputClassName(invalid?: boolean) {
  return `${INPUT_BASE} ${invalid ? "border-red-500 focus:border-red-500 focus-visible:ring-red-500" : "border-zinc-700 focus:border-amber-500"}`
}

export function selectClassName(invalid?: boolean) {
  return inputClassName(invalid)
}

export function inlineSelectClassName() {
  return "rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-60"
}

export function searchInputClassName() {
  return "w-full rounded-md border border-zinc-800 bg-zinc-900 py-2 pl-8 pr-2.5 text-base text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:py-1.5 sm:text-xs"
}

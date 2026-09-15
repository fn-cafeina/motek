export function Table({ children, caption = "Listado" }: { children: React.ReactNode; caption?: string }) {
  return (
    <div className="hidden overflow-x-auto sm:block">
      <table className="w-full text-left text-[13px] text-fg">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  )
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-border bg-raised">{children}</thead>
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>
}

export function Th({
  children,
  className = "",
  align = "left",
}: {
  children?: React.ReactNode
  className?: string
  align?: "left" | "right"
}) {
  return (
    <th
      scope="col"
      className={`h-10 px-4 text-[12px] font-semibold text-muted ${align === "right" ? "text-right" : "text-left"} ${className}`}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className = "",
  align = "left",
}: {
  children: React.ReactNode
  className?: string
  align?: "left" | "right"
}) {
  return (
    <td
      className={`px-4 py-3 align-middle ${align === "right" ? "text-right tabular-nums" : ""} ${className}`}
    >
      {children}
    </td>
  )
}

export function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="transition-colors hover:bg-raised/70">{children}</tr>
}

export function MobileList({ children }: { children: React.ReactNode }) {
  return <ul className="divide-y divide-border sm:hidden">{children}</ul>
}

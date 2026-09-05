export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="hidden overflow-x-auto sm:block">
      <table className="w-full text-left text-xs">
        <caption className="sr-only">Listado</caption>
        {children}
      </table>
    </div>
  )
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-zinc-800 text-zinc-400">{children}</thead>
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-zinc-800/60">{children}</tbody>
}

export function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={`px-3 py-2 font-medium ${className}`}>
      {children}
    </th>
  )
}

export function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className}`}>{children}</td>
}

export function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="transition-colors hover:bg-zinc-800/40">{children}</tr>
}

export function MobileList({ children }: { children: React.ReactNode }) {
  return <ul className="divide-y divide-zinc-800/60 sm:hidden">{children}</ul>
}

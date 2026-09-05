import { Card } from "./Card"
import { Brand } from "./layout/Brand"

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm">
        <div className="motek-enter mb-4">
          <Brand subtitle="Taller especializado en motocicletas" />
        </div>
        <Card className="motek-enter-2">
          <h1 className="mb-3 text-sm font-semibold tracking-wide text-zinc-100">{title}</h1>
          {children}
        </Card>
      </div>
    </div>
  )
}

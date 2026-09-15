import { Card } from "./Card"
import { Brand } from "./layout/Brand"

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm">
        <div className="motek-enter mb-6 flex justify-center">
          <Brand subtitle="Taller especializado en motocicletas" />
        </div>
        <Card className="motek-enter-2 p-6">
          <h1 className="mb-6 text-[20px] font-semibold tracking-tight text-fg">{title}</h1>
          {children}
        </Card>
      </div>
    </div>
  )
}

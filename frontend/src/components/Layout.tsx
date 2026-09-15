import { useEffect } from "react"
import { Outlet, useLocation } from "react-router"
import { ResumenProvider } from "../contexts/ResumenContext"
import { BottomNav } from "./layout/BottomNav"
import { PageContainer } from "./layout/PageContainer"
import { Sidebar } from "./layout/Sidebar"
import { Topbar } from "./layout/Topbar"
import { sectionLabel } from "./layout/nav"

export function Layout() {
  const { pathname } = useLocation()
  const title = sectionLabel(pathname)

  useEffect(() => {
    document.title = pathname === "/" ? "Motek" : `${title} — Motek`
  }, [title, pathname])

  return (
    <ResumenProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:border focus:border-border-strong focus:bg-surface focus:px-3 focus:py-2 focus:text-[13px] focus:text-fg focus:shadow-lg"
      >
        Saltar al contenido
      </a>

      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title={title} />
          <main
            id="main-content"
            tabIndex={-1}
            className="min-w-0 flex-1 px-4 pb-[max(calc(var(--shell-bottom-nav-h)+1rem),env(safe-area-inset-bottom))] pt-4 outline-none lg:px-6 lg:pb-8 lg:pt-6"
          >
            <PageContainer>
              <Outlet />
            </PageContainer>
          </main>
        </div>
      </div>

      <BottomNav />
    </ResumenProvider>
  )
}

import { Component, type ErrorInfo, type ReactNode } from "react"
import { RotateCw } from "lucide-react"
import { buttonClassName } from "./buttonStyles"

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Error de render:", error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-zinc-950 p-8 text-center text-zinc-100">
        <p className="text-sm font-semibold">Algo salió mal</p>
        <p className="max-w-md text-xs leading-[1.6] text-zinc-400">
          Ocurrió un error inesperado en la aplicación. Recargá para volver a intentarlo; si persiste, avisanos qué estabas haciendo.
        </p>
        <pre className="max-w-md overflow-x-auto rounded-md border border-zinc-800 bg-zinc-900 p-3 text-left text-[11px] text-red-400">
          {error.message}
        </pre>
        <button onClick={() => window.location.reload()} className={buttonClassName("primary")}>
          <RotateCw className="h-3.5 w-3.5" aria-hidden /> Recargar
        </button>
      </div>
    )
  }
}

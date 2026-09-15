// Same-origin by default (vite dev proxies /api to the backend); set
// VITE_API_URL to point somewhere else.
const API_URL = import.meta.env.VITE_API_URL ?? ""

export const TOKEN_KEY = "motek_token"
export const UNAUTHORIZED_EVENT = "motek:unauthorized"
/** Se emite después de cada escritura exitosa, para que el resumen del shell no quede viejo. */
export const MUTATED_EVENT = "motek:mutated"

const DEFAULT_TIMEOUT_MS = 15_000

function notifyMutation(method: string | undefined) {
  if ((method ?? "GET").toUpperCase() === "GET") return
  window.dispatchEvent(new CustomEvent(MUTATED_EVENT))
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type ApiOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown
  headers?: Record<string, string>
  timeoutMs?: number
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { body, headers: extraHeaders, timeoutMs, signal: externalSignal, ...rest } = opts

  const token = localStorage.getItem(TOKEN_KEY)
  const headers: Record<string, string> = { ...extraHeaders }
  if (body !== undefined && !headers["Content-Type"]) headers["Content-Type"] = "application/json"
  if (token) headers["Authorization"] = `Bearer ${token}`

  const controller = new AbortController()
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort()
    else externalSignal.addEventListener("abort", () => controller.abort(), { once: true })
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? DEFAULT_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers,
      signal: controller.signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ApiError(0, externalSignal?.aborted ? "Solicitud cancelada" : "La solicitud tardó demasiado. Probá de nuevo.")
    }
    throw new ApiError(0, "No se pudo conectar con el servidor")
  } finally {
    clearTimeout(timer)
  }

  if (res.status === 401 && path !== "/api/auth/login" && path !== "/api/auth/register" && path !== "/api/auth/me") {
    localStorage.removeItem(TOKEN_KEY)
    if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
    }
    throw new ApiError(401, "No autorizado")
  }

  if (res.status === 204) {
    notifyMutation(rest.method)
    return null as T
  }

  const text = await res.text()
  if (!text) {
    notifyMutation(rest.method)
    return null as T
  }

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new ApiError(res.status, text || res.statusText)
  }

  if (!res.ok) {
    const msg = typeof data === "object" && data !== null && "error" in data
      ? String((data as { error: unknown }).error)
      : res.statusText
    throw new ApiError(res.status, msg)
  }

  if (data === null) {
    notifyMutation(rest.method)
    return [] as unknown as T
  }

  notifyMutation(rest.method)
  return data as T
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080"

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const token = localStorage.getItem("motek_token")
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  if (res.status === 401 && path !== "/api/auth/login" && path !== "/api/auth/register") {
    localStorage.removeItem("motek_token")
    if (window.location.pathname !== "/login") window.location.href = "/login"
    throw new ApiError(401, "No autorizado")
  }

  if (res.status === 204) return null as T

  const text = await res.text()
  if (!text) return null as T

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

  if (data === null) return [] as unknown as T

  return data as T
}

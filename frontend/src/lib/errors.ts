import { ApiError } from "../api/client"

export function getErrorMessage(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback
}

import { Platform } from "react-native";

const TOKEN_KEY = "motek_token";
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";
const DEFAULT_TIMEOUT_MS = 15000;

const storage = Platform.OS === "web"
  ? {
      getItemAsync: async (key: string) => localStorage.getItem(key),
      setItemAsync: async (key: string, value: string) => localStorage.setItem(key, value),
      deleteItemAsync: async (key: string) => localStorage.removeItem(key),
    }
  : (() => {
      const SecureStore = require("expo-secure-store");
      return {
        getItemAsync: (key: string) => SecureStore.getItemAsync(key),
        setItemAsync: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        deleteItemAsync: (key: string) => SecureStore.deleteItemAsync(key),
      };
    })();

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { body, timeoutMs, signal: externalSignal, ...rest } = opts;

  const token = await storage.getItemAsync(TOKEN_KEY);
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const controller = new AbortController();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers,
      signal: controller.signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new ApiError(0, externalSignal?.aborted ? "Solicitud cancelada" : "La solicitud tardó demasiado. Probá de nuevo.");
    }
    throw new ApiError(0, "No se pudo conectar con el servidor");
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 && path !== "/api/auth/login" && path !== "/api/auth/register" && path !== "/api/auth/me") {
    await storage.deleteItemAsync(TOKEN_KEY);
    throw new ApiError(401, "No autorizado");
  }

  if (res.status === 204) return null as T;

  const text = await res.text();
  if (!text) return null as T;

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(res.status, text || res.statusText);
  }

  if (!res.ok) {
    const msg = typeof data === "object" && data !== null && "error" in data
      ? String((data as { error: unknown }).error)
      : res.statusText;
    throw new ApiError(res.status, msg);
  }

  return data as T;
}

export async function getToken(): Promise<string | null> {
  return storage.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await storage.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await storage.deleteItemAsync(TOKEN_KEY);
}
